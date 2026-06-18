// controllers/loginController.js
const UserModel = require('../Models/userModel');
const LogsModel = require('../Models/logsModel');

const jwt = require('jsonwebtoken');
const {session} = require('../Utility/sessionHelper');
const { encryptData, decryptData } = require("../Utility/crypto");


exports.login = async (req, res) => {
    const { username, password } = req.body;

    // Username Empty Validation
    if (!username || username.trim() === '') {
        return res.status(400).json({success:false,message: 'Username is required' });
    }

    // Password Empty Validation
    if (!password || password.trim() === '') {
        return res.status(400).json({success:false,message: 'Password is required' });
    }   

    const user = await UserModel.getUserByUsername(username); 
    
    

    if (!user) {
        return res.status(401).json({ success:false,message: 'Invalid credentials1' });
    } 

    if(user.Emp_id != username){
        return res.status(401).json({ success:false,message: 'Invalid credentials11' });
    }

    // Decrypt stored password
    let decryptedPassword;
    try {
        decryptedPassword = decryptData(user.Password);
    } catch (e) {
        console.error('Password decryption failed:', e.message);
        return res.status(500).json({ success: false, message: 'Password decryption failed' });
    }
    
    if(decryptedPassword != password){
        return res.status(401).json({ success:false,message: 'Invalid credentials' });
    } 
    
       
    const token = jwt.sign({ userId: user.UserID }, process.env.JWT_SECRET, { expiresIn: '24h' });
            
    const userdetails = {
        employeeid: user.Emp_id,
        employeename: user.Emp_name,
        designation:user.Designation,
		department:user.Department,
		manager_id:user.Manager_id
    };
    
    res.json({ success:true,message:"User Found",user:userdetails, token:{token} });
};

exports.logout = async (req, res) => {
    const { employeename } = req.body;
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('authToken', { path: '/' });
        res.clearCookie('authToken');
        res.clearCookie('connect.sid');
        return res.json({success:true,message: `Logged out successfully` });
    });
};

