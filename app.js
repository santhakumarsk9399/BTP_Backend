const express = require('express');
const session = require('express-session');
const bodyParser = require("body-parser");
const cors = require('cors');
//require("./Events/listeners");
const app = express();



require('dotenv').config();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000,  // 10 years in ms
        secure: false 
    } // 24 hours
}));


app.use('/auth', require('./Routes/loginRoutes'));
app.use('/btp', require('./Routes/businessRequestRoutes'));
// app.use('/settings/users', require('./Routes/userRoutes'));
// app.use('/settings/email', require('./Routes/emailRoutes'));
// app.use('/settings/logs', require('./Routes/logsRoutes'));
// app.use('/settings/zones', require('./Routes/zoneRoutes'));
// app.use('/settings/threshold', require('./Routes/thresHoldRoutes'));
// app.use('/settings/sms', require('./Routes/smsRoutes'));
// app.use('/dashboard', require('./Routes/dashboardRoutes'));
// app.use('/notifications', require('./Routes/notificationRoutes'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));