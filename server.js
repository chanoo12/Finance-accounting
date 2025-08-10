const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true if using https
}));

// Authentication middleware
const authenticateUser = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const connectionString = 'postgresql://neondb_owner:npg_J1gloZUcFQS2@ep-still-truth-a1051s4o-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(connectionString);

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Check for admin credentials
    if (username === 'admin' && password === 'admin_pass') {
        req.session.userId = 'admin';
        res.json({ message: 'Login successful' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// General Ledger Routes
app.get('/api/ledger', async (req, res) => {
    try {
        const entries = await sql`SELECT * FROM general_ledger ORDER BY date DESC`;
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ledger', async (req, res) => {
    const { date, description, debit, credit, balance } = req.body;
    try {
        const result = await sql`
            INSERT INTO general_ledger (date, description, debit, credit, balance)
            VALUES (${date}, ${description}, ${debit}, ${credit}, ${balance})
            RETURNING *
        `;
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ledger/:id', async (req, res) => {
    try {
        const result = await sql`
            SELECT * FROM general_ledger 
            WHERE entry_id = ${req.params.id}`;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/ledger/:id', async (req, res) => {
    const { date, description, debit, credit, balance } = req.body;
    try {
        const result = await sql`
            UPDATE general_ledger 
            SET date = ${date},
                description = ${description},
                debit = ${debit},
                credit = ${credit},
                balance = ${balance}
            WHERE entry_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/ledger/:id', async (req, res) => {
    try {
        const result = await sql`
            DELETE FROM general_ledger 
            WHERE entry_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json({ message: 'Entry deleted successfully' });
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accounts Payable Routes

// ACCOUNTS PAYABLE CRUD
app.get('/api/accounts-payable', async (req, res) => {
    try {
        const entries = await sql`SELECT * FROM accounts_payable ORDER BY ap_id DESC`;
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/accounts-payable/:id', async (req, res) => {
    try {
        const result = await sql`SELECT * FROM accounts_payable WHERE ap_id = ${req.params.id}`;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/accounts-payable', async (req, res) => {
    const { supplier_id, supplier_name, amount, due_date } = req.body;
    try {
        const result = await sql`
            INSERT INTO accounts_payable (supplier_id, supplier_name, amount, due_date)
            VALUES (${supplier_id}, ${supplier_name}, ${amount}, ${due_date})
            RETURNING *`;
        res.status(201).json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/accounts-payable/:id', async (req, res) => {
    const { supplier_id, supplier_name, amount, due_date } = req.body;
    try {
        const result = await sql`
            UPDATE accounts_payable 
            SET supplier_id = ${supplier_id},
                supplier_name = ${supplier_name},
                amount = ${amount},
                due_date = ${due_date}
            WHERE ap_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/accounts-payable/:id', async (req, res) => {
    try {
        const result = await sql`
            DELETE FROM accounts_payable 
            WHERE ap_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json({ message: 'Entry deleted successfully' });
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accounts Receivable Routes

// ACCOUNTS RECEIVABLE CRUD
app.get('/api/accounts-receivable', async (req, res) => {
    try {
        const entries = await sql`SELECT * FROM accounts_receivable ORDER BY ar_id DESC`;
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/accounts-receivable/:id', async (req, res) => {
    try {
        const result = await sql`SELECT * FROM accounts_receivable WHERE ar_id = ${req.params.id}`;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/accounts-receivable', async (req, res) => {
    const { customer_id, customer_name, amount, due_date } = req.body;
    try {
        const result = await sql`
            INSERT INTO accounts_receivable (customer_id, customer_name, amount, due_date)
            VALUES (${customer_id}, ${customer_name}, ${amount}, ${due_date})
            RETURNING *`;
        res.status(201).json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/accounts-receivable/:id', async (req, res) => {
    const { customer_id, customer_name, amount, due_date } = req.body;
    try {
        const result = await sql`
            UPDATE accounts_receivable 
            SET customer_id = ${customer_id},
                customer_name = ${customer_name},
                amount = ${amount},
                due_date = ${due_date}
            WHERE ar_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/accounts-receivable/:id', async (req, res) => {
    try {
        const result = await sql`
            DELETE FROM accounts_receivable 
            WHERE ar_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json({ message: 'Entry deleted successfully' });
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Budget Cost Tracking Routes
app.get('/api/budget', async (req, res) => {
    try {
        const entries = await sql`SELECT * FROM budget_cost_tracking ORDER BY start_date ASC`;
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/budget', async (req, res) => {
    const { category, amount, start_date, end_date } = req.body;
    try {
        const result = await sql`
            INSERT INTO budget_cost_tracking (category, amount, start_date, end_date)
            VALUES (${category}, ${amount}, ${start_date}, ${end_date})
            RETURNING *`;
        res.status(201).json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/budget/:id', async (req, res) => {
    const { category, amount, start_date, end_date } = req.body;
    try {
        const result = await sql`
            UPDATE budget_cost_tracking 
            SET category = ${category},
                amount = ${amount},
                start_date = ${start_date},
                end_date = ${end_date}
            WHERE budget_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/budget/:id', async (req, res) => {
    try {
        const result = await sql`
            DELETE FROM budget_cost_tracking 
            WHERE budget_id = ${req.params.id}
            RETURNING *`;
        if (result.length > 0) {
            res.json({ message: 'Entry deleted successfully' });
        } else {
            res.status(404).json({ error: 'Entry not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/assets', async (req, res) => {
    const { name, description, purchase_date, value } = req.body;
    try {
        const result = await sql`
            INSERT INTO assets (name, description, purchase_date, value)
            VALUES (${name}, ${description}, ${purchase_date}, ${value})
            RETURNING *
        `;
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accounts Routes
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await sql`SELECT * FROM accounts ORDER BY due_date`;
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/accounts', async (req, res) => {
    const { type, vendor_or_client, amount, due_date } = req.body;
    try {
        const result = await sql`
            INSERT INTO accounts (type, vendor_or_client, amount, due_date)
            VALUES (${type}, ${vendor_or_client}, ${amount}, ${due_date})
            RETURNING *
        `;
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Financial Reports Routes
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await sql`SELECT * FROM financial_reports ORDER BY period_start DESC`;
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reports', async (req, res) => {
    const { title, report_type, period_start, period_end, content } = req.body;
    try {
        const result = await sql`
            INSERT INTO financial_reports (title, report_type, period_start, period_end, content)
            VALUES (${title}, ${report_type}, ${period_start}, ${period_end}, ${content})
            RETURNING *
        `;
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
