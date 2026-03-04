const express = require('express');
const cors = require('cors');
const path = require('path');


require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const billsRoutes = require('./routes/bills');
const fundsRoutes = require('./routes/funds');
const noticesRoutes = require('./routes/notices');
const employeesRoutes = require('./routes/employees');
const paymentsRoutes = require('./routes/payments');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '..')));


app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/payments', paymentsRoutes);


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});


app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 M & G Traders server running at: http://localhost:${PORT}`);
    console.log('   Press Ctrl+C to stop.\n');
});
module.exports = app;
