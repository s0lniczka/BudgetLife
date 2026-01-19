const db = require('../../config/db');
const { grantAchievement } = require('../achievements/helpers');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const path = require('path');


function monthRange(month) {
  const from = `${month}-01`;
  const to = new Date(from);
  to.setMonth(to.getMonth() + 1);
  to.setDate(0);
  return { from, to: to.toISOString().slice(0, 10) };
}

function buildWhere({ userId, budget_id, month }) {
  const params = [userId];
  const where = ['e.user_id = $1'];

  if (budget_id) {
    params.push(Number(budget_id));
    where.push(`e.budget_id = $${params.length}`);
  }

  if (month) {
    const { from, to } = monthRange(month);
    params.push(from, to);
    where.push(`e.date BETWEEN $${params.length - 1} AND $${params.length}`);
  }

  return { where: where.join(' AND '), params };
}

const formatDatePL = d =>
  new Date(d).toLocaleDateString('pl-PL');



exports.list = async (req, res, next) => {
  try {
    const { budget_id, month } = req.query;
    const { where, params } = buildWhere({
      userId: req.user.id,
      budget_id,
      month
    });

    const { rows } = await db.query(
      `
      SELECT e.*, b.name AS budget_name
      FROM expenses e
      JOIN budgets b ON b.id = e.budget_id
      WHERE ${where}
      ORDER BY e.date DESC
      `,
      params
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
};



exports.create = async (req, res, next) => {
  try {
    const { budget_id, category, amount, description, date } = req.body;
    const userId = req.user.id;

    const { rows } = await db.query(
      `
      INSERT INTO expenses
      (user_id, budget_id, category, amount, description, date, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
      `,
      [userId, budget_id, category, amount, description ?? null, date]
    );

    await db.query(
      `UPDATE budgets
       SET actual_expenses = actual_expenses + $1
       WHERE id = $2 AND user_id = $3`,
      [amount, budget_id, userId]
    );

    const unlocked = await grantAchievement(userId, 2);

    res.status(201).json({
      expense: rows[0],
      achievementUnlocked: unlocked,
      achievementName: unlocked ? 'Pierwszy wydatek' : null
    });
  } catch (e) {
    next(e);
  }
};



exports.remove = async (req, res, next) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT budget_id, amount
       FROM expenses
       WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );

    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).end();
    }

    const { budget_id, amount } = rows[0];

    await client.query(
      `DELETE FROM expenses WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.user.id]
    );

    await client.query(
      `UPDATE budgets
       SET actual_expenses = actual_expenses - $1
       WHERE id=$2 AND user_id=$3`,
      [amount, budget_id, req.user.id]
    );

    await client.query('COMMIT');
    res.status(204).end();
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
};



exports.exportXLS = async (req, res, next) => {
  try {
    const { budget_id, month } = req.query;
    const { where, params } = buildWhere({
      userId: req.user.id,
      budget_id,
      month
    });

    const { rows } = await db.query(
      `
      SELECT e.date, b.name AS budget, e.category, e.amount, e.description
      FROM expenses e
      JOIN budgets b ON b.id = e.budget_id
      WHERE ${where}
      ORDER BY e.date
      `,
      params
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Wydatki');

    ws.columns = [
      { header: 'Data', key: 'date', width: 14 },
      { header: 'Budżet', key: 'budget', width: 22 },
      { header: 'Kategoria', key: 'category', width: 20 },
      { header: 'Kwota (zł)', key: 'amount', width: 16 },
      { header: 'Opis', key: 'description', width: 30 }
    ];

    let total = 0;

rows.forEach(r => {
  total += Number(r.amount);

  const row = ws.addRow({
    date: formatDatePL(r.date),
    budget: r.budget,
    category: r.category,
    amount: Number(r.amount),
    description: r.description
  });

  row.getCell('amount').numFmt = '#,##0.00 "zł"';
});


ws.addRow({});


const sumRow = ws.addRow({
  category: 'SUMA',
  amount: total
});

sumRow.font = { bold: true };
sumRow.getCell('amount').numFmt = '#,##0.00 "zł"';


    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=wydatki.xlsx'
    );

    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
};




exports.exportPDF = async (req, res, next) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  try {
    const { budget_id, month } = req.query;

    // === FILTRY ===
    const { where, params } = buildWhere({
      userId: req.user.id,
      budget_id,
      month
    });

    const { rows } = await db.query(
      `
      SELECT 
        e.date,
        b.name AS budget,
        e.category,
        e.amount,
        e.description
      FROM expenses e
      JOIN budgets b ON b.id = e.budget_id
      WHERE ${where}
      ORDER BY e.date ASC
      `,
      params
    );

    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=wydatki.pdf');
    doc.pipe(res);

    
    doc.registerFont(
      'DejaVu',
      path.join(__dirname, '../../assets/fonts/DejaVuSans.ttf')
    );
    doc.registerFont(
      'DejaVu-Bold',
      path.join(__dirname, '../../assets/fonts/DejaVuSans-Bold.ttf')
    );

    doc.font('DejaVu');

   
    doc.fontSize(20).text('Raport wydatków', { align: 'center' });
    doc.moveDown(1);

    
    const monthly = {};
    rows.forEach(r => {
      const m = r.date.toISOString().slice(0, 7);
      monthly[m] = (monthly[m] || 0) + Number(r.amount || 0);
    });

    const chart = new ChartJSNodeCanvas({ width: 700, height: 350 });
    const chartImage = await chart.renderToBuffer({
      type: 'bar',
      data: {
        labels: Object.keys(monthly),
        datasets: [{
          label: 'Wydatki (zł)',
          data: Object.values(monthly),
          backgroundColor: '#34d399'
        }]
      },
      options: {
        plugins: { legend: { display: true } },
        scales: {
          y: {
            ticks: {
              callback: v => `${v} zł`
            }
          }
        }
      }
    });

    doc.image(chartImage, { fit: [500, 260], align: 'center' });
    doc.moveDown(2);

    
    const rowH = 22;
    const col = {
      date: 70,
      budget: 120,
      category: 90,
      amount: 80,
      desc: 150
    };

    const startX = doc.x;
    let y = doc.y;

    const drawCell = (text, x, y, w, h, header = false, align = 'left') => {
      doc.rect(x, y, w, h).stroke();
      doc
        .font(header ? 'DejaVu-Bold' : 'DejaVu')
        .fontSize(header ? 10 : 9)
        .text(String(text ?? ''), x + 4, y + 6, {
          width: w - 8,
          align
        });
    };

    
    drawCell('Data', startX, y, col.date, rowH, true);
    drawCell('Budżet', startX + col.date, y, col.budget, rowH, true);
    drawCell('Kategoria', startX + col.date + col.budget, y, col.category, rowH, true);
    drawCell('Kwota (zł)', startX + col.date + col.budget + col.category, y, col.amount, rowH, true, 'right');
    drawCell('Opis', startX + col.date + col.budget + col.category + col.amount, y, col.desc, rowH, true);

    y += rowH;

    
    let total = 0;

    for (const r of rows) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = doc.y;
      }

      const amount = Number(r.amount) || 0;
      total += amount;

      drawCell(formatDatePL(r.date), startX, y, col.date, rowH);
      drawCell(r.budget, startX + col.date, y, col.budget, rowH);
      drawCell(r.category, startX + col.date + col.budget, y, col.category, rowH);
      drawCell(amount.toFixed(2) + ' zł', startX + col.date + col.budget + col.category, y, col.amount, rowH, false, 'right');
      drawCell(r.description || '', startX + col.date + col.budget + col.category + col.amount, y, col.desc, rowH);

      y += rowH;
    }

    
    y += 12;
    doc
      .font('DejaVu-Bold')
      .fontSize(12)
      .text(
        `SUMA: ${total.toFixed(2)} zł`,
        startX,
        y,
        {
          width: col.date + col.budget + col.category + col.amount + col.desc,
          align: 'right'
        }
      );

    doc.end();

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Błąd generowania PDF' });
    }
  }
};



exports.byCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { budget_id } = req.query;

    const params = [userId];
    let where = 'user_id = $1';

    if (budget_id) {
      params.push(Number(budget_id));
      where += ` AND budget_id = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT category, SUM(amount)::numeric AS total
       FROM expenses
       WHERE ${where}
       GROUP BY category
       ORDER BY total DESC`,
      params
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.recent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { budget_id } = req.query;

    const params = [userId];
    let where = 'e.user_id = $1';

    if (budget_id) {
      params.push(Number(budget_id));
      where += ` AND e.budget_id = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT e.*, b.name AS budget_name
       FROM expenses e
       JOIN budgets b ON b.id = e.budget_id
       WHERE ${where}
       ORDER BY e.date DESC
       LIMIT 10`,
      params
    );

    res.json(rows);
  } catch (e) {
    next(e);
  }
};
