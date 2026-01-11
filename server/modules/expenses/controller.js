const db = require('../../config/db');
const { grantAchievement } = require('../achievements/helpers');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const path = require('path');
const fs = require('fs');

const toNum = (v) =>
  v === undefined || v === null || v === '' ? null : Number(v);

/* ===================== LIST ===================== */
exports.list = async (req, res, next) => {
  try {
    const { budget_id, from, to } = req.query;

    const params = [req.user.id];
    const where = ['e.user_id = $1'];

    if (budget_id) {
      params.push(Number(budget_id));
      where.push(`e.budget_id = $${params.length}`);
    }

    if (from) {
      params.push(from);
      where.push(`e."date" >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      where.push(`e."date" <= $${params.length}`);
    }

    const sql = `
      SELECT e.*, b.name AS budget_name
      FROM expenses e
      JOIN budgets b ON e.budget_id = b.id AND b.user_id = $1
      WHERE ${where.join(' AND ')}
      ORDER BY e."date" DESC, e.id DESC
    `;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

/* ===================== GET ONE ===================== */
exports.getOne = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const { rows } = await db.query(
      `SELECT id, user_id, budget_id, category, amount::float8 AS amount, description, "date"
       FROM expenses
       WHERE id=$1 AND user_id=$2`,
      [id, req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
};

/* ===================== CREATE ===================== */
exports.create = async (req, res, next) => {
  try {
    const { budget_id, category, amount, description, date } = req.body;
    const userId = req.user.id;

    if (!budget_id || !category || amount === undefined || !date) {
      return res.status(400).json({
        error: 'budget_id, category, amount, date są wymagane'
      });
    }

    const owns = await db.query(
      'SELECT 1 FROM budgets WHERE id=$1 AND user_id=$2',
      [Number(budget_id), userId]
    );
    if (!owns.rowCount) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // 🔥 NAJWAŻNIEJSZE:
    // date = DATA MERYTORYCZNA (YYYY-MM-DD)
    // created_at = NOW()
    const { rows } = await db.query(
      `INSERT INTO expenses
        (user_id, budget_id, category, amount, description, "date", created_at)
       VALUES ($1,$2,$3,$4,$5,$6, NOW())
       RETURNING *`,
      [
        userId,
        Number(budget_id),
        category,
        toNum(amount),
        description ?? null,
        date // ⬅️ STRING YYYY-MM-DD
      ]
    );

    await db.query(
      `UPDATE budgets
       SET actual_expenses = COALESCE(actual_expenses, 0) + $1
       WHERE id = $2 AND user_id = $3`,
      [toNum(amount), Number(budget_id), userId]
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



/* ===================== UPDATE ===================== */
exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const { category, amount, description, date, budget_id } = req.body;

    const cur = await db.query(
      'SELECT * FROM expenses WHERE id=$1 AND user_id=$2',
      [id, userId]
    );
    const row = cur.rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });

    let newBudgetId = row.budget_id;

    if (budget_id && Number(budget_id) !== row.budget_id) {
      const owns = await db.query(
        'SELECT 1 FROM budgets WHERE id=$1 AND user_id=$2',
        [Number(budget_id), userId]
      );
      if (!owns.rowCount)
        return res.status(404).json({ error: 'Budget not found' });
      newBudgetId = Number(budget_id);
    }

    const { rows } = await db.query(
      `UPDATE expenses SET
         budget_id   = $1,
         category    = COALESCE($2, category),
         amount      = COALESCE($3, amount),
         description = COALESCE($4, description),
         "date"      = COALESCE($5, "date")
       WHERE id=$6 AND user_id=$7
       RETURNING *`,
      [
        newBudgetId,
        category ?? null,
        amount !== undefined ? toNum(amount) : null,
        description ?? null,
        date ?? null, // tu CELOWO zostawiamy możliwość edycji
        id,
        userId
      ]
    );

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
};

/* ===================== REMOVE ===================== */
exports.remove = async (req, res, next) => {
  const client = await db.connect();
  const userId = req.user.id;

  try {
    await client.query('BEGIN');

    const { rows: exp } = await client.query(
      'SELECT budget_id, amount FROM expenses WHERE id=$1 AND user_id=$2',
      [req.params.id, userId]
    );

    if (!exp.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Nie znaleziono wydatku' });
    }

    const { budget_id, amount } = exp[0];

    await client.query(
      'DELETE FROM expenses WHERE id=$1 AND user_id=$2',
      [req.params.id, userId]
    );

    await client.query(
      'UPDATE budgets SET actual_expenses = actual_expenses - $1 WHERE id=$2 AND user_id=$3',
      [amount, budget_id, userId]
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

/* ===================== BY CATEGORY ===================== */
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
      `SELECT category, SUM(amount)::float8 AS total
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

/* ===================== RECENT ===================== */
exports.recent = async (req, res) => {
  const { budget_id } = req.query;

  try {
    const result = await db.query(
      `SELECT e.*, b.name AS budget_name
       FROM expenses e
       JOIN budgets b ON e.budget_id = b.id
       WHERE e.budget_id=$1 AND b.user_id = e.user_id
       ORDER BY e.date DESC
       LIMIT 10`,
      [budget_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function formatDatePL(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pl-PL');
}

function excelSafeDate(d) {
  const date = new Date(d);
  date.setHours(12); // 🔥 południe = zero problemów UTC
  return date;
}


exports.exportXLS = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT 
         e.date,
         b.name AS budget,
         e.category,
         e.amount,
         e.description
       FROM expenses e
       JOIN budgets b ON b.id = e.budget_id
       WHERE e.user_id = $1
       ORDER BY e.date DESC`,
      [userId]
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Wydatki');

    // ====== KOLUMNY ======
    worksheet.columns = [
      { header: 'Data', key: 'date', width: 14 },
      { header: 'Budżet', key: 'budget', width: 22 },
      { header: 'Kategoria', key: 'category', width: 20 },
      { header: 'Kwota (zł)', key: 'amount', width: 16 },
      { header: 'Opis', key: 'description', width: 30 }
    ];

    // ====== STYL NAGŁÓWKA ======
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' } // jasny szary
      };
      cell.border = borderAll();
    });

    // ====== DANE ======
    rows.forEach(r => {
      const row = worksheet.addRow({
        date: excelSafeDate(r.date),
        budget: r.budget,
        category: r.category,
        amount: Number(r.amount),
        description: r.description
      });

      row.getCell('amount').numFmt = '#,##0.00 "zł"';

      row.eachCell(cell => {
        cell.border = borderAll();
      });
    });

    // ====== PUSTY WIERSZ ======
    worksheet.addRow({});

    // ====== SUMA ======
    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

    const sumRow = worksheet.addRow({
      category: 'SUMA',
      amount: total
    });

    sumRow.font = { bold: true };
    sumRow.getCell('amount').numFmt = '#,##0.00 "zł"';

    sumRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thick' },
        left: { style: 'thin' },
        right: { style: 'thin' },
        bottom: { style: 'thin' }
      };
    });

    // ====== AUTOFILTER ======
    worksheet.autoFilter = {
      from: 'A1',
      to: 'E1'
    };

    // ====== RESPONSE ======
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=wydatki.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    next(err);
  }
};

function borderAll() {
  return {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
}

exports.exportPDF = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT e.date, b.name AS budget, e.category, e.amount, e.description
       FROM expenses e
       JOIN budgets b ON b.id = e.budget_id
       WHERE e.user_id = $1
       ORDER BY e.date ASC`,
      [userId]
    );

    // ======================
    // 📊 agregacja miesięczna
    // ======================
    const monthly = {};
    let total = 0;

    rows.forEach(r => {
      const m = r.date.toISOString().slice(0, 7);
      monthly[m] = (monthly[m] || 0) + Number(r.amount);
      total += Number(r.amount);
    });

    // ======================
    // 📈 wykres
    // ======================
    const chartCanvas = new ChartJSNodeCanvas({ width: 700, height: 350 });
    const chartImage = await chartCanvas.renderToBuffer({
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
              callback: value => `${value} zł`
            }
          }
        }
      }
    });

    // ======================
    // 📄 PDF
    // ======================
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=wydatki.pdf');
    doc.pipe(res);

    const fontPath = path.join(__dirname, '../../assets/fonts/DejaVuSans.ttf');
    doc.font(fontPath);

    // ======================
    // 🧾 tytuł
    // ======================
    doc.fontSize(20).text('Raport wydatków', { align: 'center' });
    doc.moveDown(1);

    // ======================
    // 📊 wykres
    // ======================
    doc.image(chartImage, {
      fit: [500, 260],
      align: 'center'
    });

    doc.moveDown(1.5);

    // ======================
    // 📋 tabela
    // ======================
    const rowH = 22;
    const col = {
      date: 80,
      budget: 120,
      category: 110,
      amount: 90,
      desc: 130
    };

    const drawCell = (text, x, y, w, h) => {
      doc.rect(x, y, w, h).stroke();
      doc.text(text, x + 4, y + 6, {
        width: w - 8,
        height: h - 8
      });
    };

    let x = doc.x;
    let y = doc.y;

    doc.fontSize(10);

    // nagłówek
    drawCell('Data', x, y, col.date, rowH);
    drawCell('Budżet', x + col.date, y, col.budget, rowH);
    drawCell('Kategoria', x + col.date + col.budget, y, col.category, rowH);
    drawCell('Kwota (zł)', x + col.date + col.budget + col.category, y, col.amount, rowH);
    drawCell('Opis', x + col.date + col.budget + col.category + col.amount, y, col.desc, rowH);

    y += rowH;

    // dane
    rows.forEach(r => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = doc.y;
      }

      drawCell(formatDatePL(r.date), x, y, col.date, rowH);
      drawCell(r.budget, x + col.date, y, col.budget, rowH);
      drawCell(r.category, x + col.date + col.budget, y, col.category, rowH);
      drawCell(`${Number(r.amount).toFixed(2)} zł`, x + col.date + col.budget + col.category, y, col.amount, rowH);
      drawCell(r.description || '', x + col.date + col.budget + col.category + col.amount, y, col.desc, rowH);

      y += rowH;
    });

    // ======================
    // ➕ suma
    // ======================
    doc.moveDown(1);
    doc.fontSize(12).text(`SUMA: ${total.toFixed(2)} zł`, { align: 'right' });

    doc.end();

  } catch (err) {
    next(err);
  }
};