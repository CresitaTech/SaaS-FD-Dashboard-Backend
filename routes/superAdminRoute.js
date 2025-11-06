const express = require('express');
const {createCompanyAdmin, getCompanyLogo, getCompanyAdmin, deleteCompanyAdmin,updateCompanyAdmin} = require('../controllers/superAdminController');
const upload = require('../middleware/multer');
const { route } = require('./authRoutes');

const router = express.Router();

router.post('/add-company-admin',upload.single('logo'),createCompanyAdmin);
router.get('/get-company-admin',getCompanyAdmin);
router.delete('/delete-company-admin/:email',deleteCompanyAdmin);
router.put('/update-company-admin/:email',upload.single('logo'),updateCompanyAdmin);
router.get('/get-company-logo',getCompanyLogo);

module.exports = router;