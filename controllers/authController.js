const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { sendEmail } = require("../service/mail");

const frontendUrl = 'http://164.68.100.175:5177/login'

exports.superAdmin = async(req,res) =>{
    const { email,password } = req.body;
    let connection;
    try {
        if(!email || !password){
            return res.status(404).json({
                message:"Email and password is required to create super admin account"
            })
        }
        
        connection = await pool.getConnection(); 
        const [user] = await connection.query(
            "SELECT * FROM users WHERE email = ? AND role_id = ?",
            [email,6]
        )
       if(user.length !=0){
            return res.status(409).json({
                message:'User already exists! Please Login'
            })
        }
        //hash the password
        const hashedPassword = await bcrypt.hash(password,10);
        await connection.query(
            "INSERT INTO users (email,password,role_id) VALUES(?,?,?)",
            [email,hashedPassword,6]
        )
        return res.status(201).json({
            message: 'Super Admin account created successfully'
        });
    } catch (error) {
        console.log('failed to register the new user');
        return res.status(500).json(error.message);
    }finally{
        if (connection) connection.release();
    }
}

exports.loginSuperAdmin = async (req, res) => {
  let connection;
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are required to login the user",
      });
    }

    connection = await pool.getConnection();

    const [row] = await connection.query(
      "SELECT id, email, password, role_id FROM users WHERE email = ? AND role_id = ?",
      [email, 7]
    );

    if (row.length === 0) {
      return res.status(404).json({
        message: "Super admin doesn't exist with this email",
      });
    }

    const user = row[0];

    // match the password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Password is incorrect",
      });
    }

    // generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      message: "Super Admin login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error.message);
  } finally {
    if (connection) connection.release();
  }
};

exports.loginCompanyAdmin = async(req,res) =>{
    let connection
    const { email,password } = req.body;
    try {
        if(!email || !password){
            return res.status(404).json({
                message:"Company Name and password is requried"
            })
        }
        connection = await pool.getConnection();

        const [row] = await connection.query(
            "SELECT id,email,company,logo,password FROM users WHERE email = ? AND role_id = ?",
            [email,8]
        )
        if(row.length === 0){
            return res.status(409).json({
                message:"Account doesn't exists"
            })
        }
        const user = row[0];

        //match the password
        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect){
            return res.status(404).json({
                message:"Password is incorrect"
            })
        }
        // generate JWT
        const token = jwt.sign(
        { id: user.id,email:user.email,logo:user.logo, company: user.company, role_id: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
        );

        return res.status(202).json({
            message:"Company Admin logged in successfully",
            token,
            user:{
                userId:user.id,
                companyName:user.company,
                logo:user.logo
            }
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json(error.message);
    }
}

exports.registerUser = async(req,res) =>{
    // const {id} = req.user;
    // console.log("userid:",id);
    const { firstName,lastName,userName,email,password,role,companyName, registered_by} = req.body;
    console.log("boddyd",req.body )

    let connection
    try {
        if(!firstName){
            return res.status(400).json({
                message:'Please enter the first name'
            })
        }if(!lastName){
            return res.status(400).json({
                message:'Please enter the last name'
            })
        }if(!userName){
            return res.status(400).json({
                message:'Please enter user name'
            })
        }if(!email){
            return res.status(400).json({
                message:'Please enter your email'
            })
        }if(!password){
            return res.status(400).json({
                message:'Please enter your password'
            })
        }if(!role){
            return res.status(400).json({
                message:'Please enter your role'
            })
        }

        connection = await pool.getConnection()
        //check is the user exists or not
        const [user] = await connection.query(
            "SELECT email FROM users WHERE email = ?",
            [email]
        )
        if(user.length !=0){
            return res.status(409).json({
                message:'User already exists! Please Login'
            })
        }
        //hash the password
        const hashedPassword = await bcrypt.hash(password,10);

        // role mapping
            const roleMap = {
            1: "Supply Chain Leadership",
            2: "Supply Chain Operations",
            3: "Finance",
            4: "CFO/Head of finance",
            5: "CPO"
        };

        const roleName = roleMap[role] || "Unknown";
        // send email to the user
        // await sendEmail({
        //     email:email,
        //     credential:`URL:${frontendUrl}/${companyName}, Email: ${email}, Password: ${password}, Role: ${roleName}`
        // });

        //store in the database
        await connection.query(
            "INSERT INTO users (firstName,lastName,userName,email,password,role_id,registered_by,company) VALUES(?,?,?,?,?,?,?,?)",
            [firstName,lastName,userName,email,hashedPassword,role, registered_by, companyName]
        )
        

        return res.status(201).json({
            message: 'User registered successfully'
        });
    } catch (error) {
        console.log('failed to register the new user');
        return res.status(500).json(error.message);
    }finally{
        if (connection) connection.release();
    }
}

exports.loginUser = async(req,res) =>{
    console.log("running");
    const { email,password,role_id } = req.body;
    console.log("Body;",req.body);
    let connection

    try {
        if(!email){
            return res.status(400   ).json({message:'Email is required'})
        }
        if(!password){
            return res.status(400   ).json({message:'Password is required'});
        }
        if(!role_id){
            return res.status(400   ).json({message:'Role Id is required'});
        }
        
        connection = await pool.getConnection()
        
        //check if user already exists or not
        const [user] = await connection.query(
            "SELECT * FROM users WHERE email = ? AND role_id = ?",
            [email,role_id]
        )
        console.log("User:",user);
        
        if (user.length === 0) {
          return res
            .status(401)
            .json({ message: "Invalid email, password or role" });
        }
        const userData = user[0]
       
        //verify password
        const isPasswordValid = await bcrypt.compare(password,userData.password);
        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ message: "Invalid email/mobile or password" });
        }

        let logo = userData.logo;
        if (userData.registered_by) {
        const [adminRow] = await connection.query(
            "SELECT logo FROM users WHERE id = ?",
            [userData.registered_by]
        );
        if (adminRow.length > 0) {
            logo = adminRow[0].logo;
        }
        }

        //create jwt token
        const token = jwt.sign(
            {
                id:userData.id,
                email:userData.email,
                role_id:userData.role_id
            },
            process.env.JWT_SECRET,
            { expiresIn:'24h' }
        )
        res.status(200).json({
            message:'User logged in successfully',
            token,
            companyLogo:logo,
            user:{
                id:userData.id,
                email:userData.email,
                role_id:userData.role_id,
            }
        })
    } catch (error) {
        console.log('failed to login the user',error.message);
        return res.status(500).json(error.message);
    }finally{
        if(connection){
            connection.release();
        }
    }
}

exports.getAllUsers = async (req, res) => {
  let connection;
  const { companyName } = req.params;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
  "SELECT firstName, lastName, email, company, role_id FROM users WHERE company = ? AND role_id IN (?,?,?, ?, ?)",
  [companyName, 1,2 ,3,4, 5]
);

    if(rows.length === 0){
      return res.status(200).json({
        message:"No Users found"  
      })
    }
    res.status(200).json({
      success: true,
      users: rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    if (connection) connection.release();
  }
};

exports.updateUser = async (req, res) => {
  let connection;
  const { email } = req.params;
  const { firstName, lastName, userName, newEmail, role } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        message: "Email (in params) is required",
      });
    }

    connection = await pool.getConnection();

    // Check if user exists
    const [user] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success:false,
        message: "User not found",
      });
    }

    // Update user
    await connection.query(
      `UPDATE users 
       SET firstName = ?, lastName = ?, userName = ?, email = ?, role_id = ? 
       WHERE email = ?`,
      [firstName, lastName, userName, newEmail || email, role, email]
    );

    res.status(200).json({
      success:true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

exports.deleteUser =async(req,res) =>{
  let connection
  const { email } = req.params;
  try {
     if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
    }
    connection = await pool.getConnection();
    const [result] = await connection.query(
      "DELETE FROM users WHERE email = ?",
      [email]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }finally{
    if(connection)connection.release();
  }
}

exports.getLogoForUser = async(req,res) =>{
  let connection;
  const { email } = req.params;
  try {
    if(!email){
      return res.status(409).json({
        message:"Email is required"
      })
    }
    connection = await pool.getConnection();

   const [row] = await connection.query(
      "SELECT registered_by FROM users WHERE email = ?",
      [email]
    )
    if(row.length === 0){
      return res.status(404).json({
        message:"End User not found"
      })
    }
    const userId = row[0].registered_by;

    const [result] = await connection.query(
      "SELECT logo FROM users WHERE id = ?",
      [userId]
    )
    const logo = result[0].logo;
    console.log("logo:",logo);
    return res.status(200).json({
      message:"Logo Fetched successfully",
      logo
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json(error)
  }finally{
    if(connection)connection.release();
  }
}

exports.getCompanyLogoByName = async(req,res) =>{
  let connection;
  const { companyName } = req.params;
  try {
    if(!companyName){
      return res.status(404).json({
        message:"Company Name is required"
      })
    }
    connection = await pool.getConnection();

    const [row] = await connection.query(
      "SELECT logo FROM users WHERE company = ?",
      [companyName]
    )
    const logo = row[0].logo;
    return res.status(200).json({
      message:"Logo fetched successfully",
      logo
    })
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error)
  }finally{
    if(connection)connection.release();
  }
}