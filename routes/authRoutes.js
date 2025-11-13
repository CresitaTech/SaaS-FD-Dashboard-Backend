const express = require('express');
const { registerUser, loginUser, superAdmin, loginSuperAdmin, loginCompanyAdmin, getAllUsers, updateUser, getLogoForUser, getCompanyLogoByName, deleteUser } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMidlleware');

const router = express.Router();

router.post('/register',registerUser);
router.post('/login',loginUser);
router.post('/add-superAdmin',superAdmin);
router.post('/login-superAdmin',loginSuperAdmin);
router.post('/login-companyAdmin',loginCompanyAdmin);
router.get('/getAllUsers/:companyName',getAllUsers);
router.put('/updateUser/:email',updateUser);
router.delete('/deleteUser/:email',deleteUser);
router.get("/getLogoForUser/:email",getLogoForUser);
router.get("/getCompanyLogoByName/:companyName",getCompanyLogoByName);

module.exports = router;