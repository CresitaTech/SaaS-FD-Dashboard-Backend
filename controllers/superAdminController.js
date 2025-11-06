const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../service/mail");

const frontendURL = 'http://localhost:5173/company-admin/login'

exports.createCompanyAdmin = async (req, res) => {
  let connection;
  const { email, company, password } = req.body;

  try {
    if (!email || !company || !password || !req.file) {
      return res.status(400).json({
        message: "All fields are required to create the company admin account",
      });
    }

    connection = await pool.getConnection();

    // Check if email already exists
    const [user] = await connection.query(
      "SELECT email FROM users WHERE email = ?",
      [email] 
    );

    if (user.length !== 0) {
      return res.status(409).json({
        message: "Company Admin already exists",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

     // Save file path (from multer)
    const filePath = `uploads/${req.file.filename}`;

    // Insert into users table
    const [result] = await connection.query(
      "INSERT INTO users (email, company, password, role_id,logo) VALUES (?, ?, ?, ?,?)",
      [email, company, hashedPassword, 7,filePath]
    );

      await sendEmail({
          email:email,
          credential:`URL:${frontendURL}/${company} Email: ${email}, Password: ${password},`
      });
    return res.status(201).json({
      message: "Company Admin account created successfully",
      userId: result.insertId,
      
    });

  } catch (error) {
    console.error("Error creating company admin:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

exports.getCompanyAdmin = async(req,res) =>{
  let connection;
  try {
    connection = await pool.getConnection();

    const [row] = await connection.query(
      "SELECT company,email,logo FROM users WHERE role_id = ?",
      [7]
    )
    console.log("Row:",row);
    const result = row;
    // console.log("Result:",result);
    return res.status(200).json({
      message:"Company data fetched successfully",
      result
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }finally{
    if(connection)connection.release();
  }
}

exports.deleteCompanyAdmin = async (req, res) => {
  let connection;
  const {email}  = req.params; // get user id from request params
  console.log("email:",email);
  try {
    if (!email) {
      return res.status(400).json({
        message: "Email is required to delete the company admin",
      });
    }

    connection = await pool.getConnection();

    // Check if the user exists
    const [user] = await connection.query(
      "SELECT * FROM users WHERE email = ? AND role_id = ?",
      [email, 7] // assuming role_id = 1 is company admin
    );

    if (user.length === 0) {
      return res.status(404).json({
        message: "Company admin not found",
      });
    }

    // Delete user
    await connection.query("DELETE FROM users WHERE email = ? AND role_id = ?", [
      email,
      7,
    ]);

    return res.status(200).json({
      message: "Company admin deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateCompanyAdmin = async (req, res) => {
  let connection;
  const { email } = req.params; // existing email (identifier from URL)
  const { newEmail, company, password } = req.body; // fields sent in form-data
  const logoFile = req.file; // file from multer

  try {
    connection = await pool.getConnection();

    // Check if user exists
    const [rows] = await connection.query(
      "SELECT id, email, company, password, logo FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Company Admin not found",
      });
    }

    // If updating email, check if new email already exists
    if (newEmail && newEmail !== email) {
      const [existingUser] = await connection.query(
        "SELECT id FROM users WHERE email = ?",
        [newEmail]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({
          message: "Email already exists. Please use a different email.",
        });
      }
    }

    // Build update query dynamically
    let updateFields = [];
    let values = [];  

    if (newEmail && newEmail !== email) {
      updateFields.push("email = ?");
      values.push(newEmail);
    }

    if (company) {
      updateFields.push("company = ?");
      values.push(company);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      values.push(hashedPassword);
    }

    if (logoFile) {
      const logoPath = `/uploads/${logoFile.filename}`;
      updateFields.push("logo = ?");
      values.push(logoPath);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        message: "No fields provided to update",
      });
    }

    values.push(email); // WHERE condition

    const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE email = ?`;
    await connection.query(updateQuery, values);

    await sendEmail({
        email:newEmail,
        credential:`URL:${frontendURL} Email: ${newEmail}, Password: ${password},`
      });
    return res.status(200).json({
      message: "Company Admin updated successfully",

    });

  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

exports.getCompanyLogo = async(req,res) =>{
  let connection;
  const { email } = req.query;
  try {
    if(!email){
      return res.status(404).json({
        message:"Email is required"
      })
    }
    connection = await pool.getConnection();

    const [row] = await connection.query(
      "SELECT logo FROM users WHERE email = ?",
      [email]
    )
    if(row.length === 0){
      return res.status(409).json({
        message:'Email not exits'
      })
    }
    const logo = row[0].logo;

    return res.status(200).json({
      message:"Logo fetched successfully",
      companyLogo:logo
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
}
