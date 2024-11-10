import express from "express";
import bcryt from "bcrypt";
const router = express.Router();
import { User } from "../models/user.js";
import { Company } from "../models/Company.js";
import { Interview } from "../models/Experience.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

router.post("/register", async (req, res) => {
  const {
    name,
    email,
    password,
    contactNumber,
    sapId,
    rollNo,
    gender,
    dob,
    tenthPercentage,
    tenthSchool,
    twelfthPercentage,
    twelfthCollege,
    graduationCollege,
    graduationCGPA,
    stream,
    sixthSemesterCGPA,
    isAdmin,
  } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    return res.json({ message: "User already existed" });
  }

  const hashpassword = await bcryt.hash(password, 10);
  const newUser = new User({
    name,
    email,
    password: hashpassword,
    contactNumber,
    sapId,
    rollNo,
    gender,
    dob,
    tenthPercentage,
    tenthSchool,
    twelfthPercentage,
    twelfthCollege,
    graduationCollege,
    graduationCGPA,
    stream,
    sixthSemesterCGPA,
    isAdmin,
  });

  await newUser.save();
  return res.json({ message: "User Registered" });
});

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    console.log("Invalid User");
    return res.json("Invalid User");
  }

  const validPassword = await bcryt.compare(password, user.password);
  if (!validPassword) {
    console.log("Password Incorrect");
    return res.json("Password Incorrect");
  }

  if (user.isAdmin === "1") {
    console.log("User is admin");
  }

  const token = jwt.sign(
    { _id: user._id, username: user.username },
    process.env.KEY,
    { expiresIn: "1h" }
  );

  res.cookie("token", token, { httpOnly: true, maxAge: 300000 });

  return res.json(user.isAdmin === "1" ? "Admin" : "Success");
});

const verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json({ status: false, message: "No Token" });
    }
    const decoded = jwt.verify(token, process.env.KEY);
    next();
  } catch (err) {
    return res.json(err);
  }
};

router.get("/verify", verifyUser, (req, res) => {
  return res.json({ status: true, message: "Authorized" });
});

router.get("/currentUser", verifyUser, async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.KEY);
    const userId = decoded._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not registered" });
    }
    const token = jwt.sign({ id: user._id }, process.env.KEY, {
      expiresIn: "5m",
    });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "", 
        pass: "",
      },
    });

    var mailOptions = {
      from: "jashmehtaa@gmail.com",
      to: email,
      subject: "Reset Password Link",
      text: `http://localhost:3000/resetPassword/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.json({ status: true, message: "Error sending the email" });
      } else {
        return res.json({ status: true, message: "Email Sent" });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/resetPassword/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = await jwt.verify(token, process.env.KEY);
    const id = decoded.id;

    const hashPassword = await bcryt.hash(password, 10);

    await User.findByIdAndUpdate({ _id: id }, { password: hashPassword });

    return res.json({ status: true, message: "Updated Password Successfully" });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ status: false, message: "Invalid Token" });
  }
});

router.post("/applyCompany/:userId/:companyId", async (req, res) => {
  const { userId, companyId } = req.params;
  console.log("User ID: ", userId);
  console.log("Company ID:", companyId);

  try {
    const user = await User.findById(userId);
    console.log("User:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.appliedCompanies) {
      user.appliedCompanies = [];
    }

    if (user.appliedCompanies.includes(companyId)) {
      return res
        .status(400)
        .json({ message: "User already applied to this company" });
    }

    user.appliedCompanies.push(companyId);
    await user.save();

    return res.json({ message: "Company applied successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/scheduledInterviews/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const appliedCompanyIds = user.appliedCompanies;
    const companies = await Company.find({ _id: { $in: appliedCompanyIds } });

    const scheduledInterviews = companies.map((company) => ({
      companyName: company.companyname,
      interviewDate: company.doi,
    }));

    return res.json({ scheduledInterviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/add-interview", async (req, res) => {
  try {
    const {
      username,
      companyName,
      position,
      experience,
      interviewLevel,
      result,
    } = req.body;

    const newInterview = new Interview({
      username,
      companyName,
      position,
      experience,
      interviewLevel,
      result,
    });

    await newInterview.save();

    return res.json({ message: "Interview experience added successfully" });
  } catch (error) {
    console.error("Error adding interview experience:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/fetchinterviewexperience", async (req, res) => {
  try {
    const interviews = await Interview.find({});
    return res.json({ data: interviews });
  } catch (error) {
    console.error("Error fetching interview experiences:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get('/placementStatus/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const status = user.placementStatus;

    if (status === 'Placed') {
      const companyName = user.companyPlaced;
      return res.json({ status, companyName });
    }

    return res.json({ status });
  } catch (error) {
    console.error('Error fetching placement status:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.post("/add-companies", async (req, res) => {
  const {
    companyname,
    jobprofile,
    jobdescription,
    website,
    ctc,
    doi,
    eligibilityCriteria,
    tenthPercentage,
    twelfthPercentage,
    graduationCGPA,
    sixthSemesterCGPA,
  } = req.body;

  try {
    const newCompany = new Company({
      companyname,
      jobprofile,
      jobdescription,
      website,
      ctc,
      doi,
      eligibilityCriteria,
      tenthPercentage,
      twelfthPercentage,
      graduationCGPA,
      sixthSemesterCGPA,
    });

    await newCompany.save();
    console.log(newCompany);
    return res.json({ message: "Company Registered" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


router.get("/getUsers", async (req, res) => {
  try {
    const allUsers = await User.find({});

    res.send({ data: allUsers });
  } catch (error) {
    console.log(error);
  }
});

router.get("/getCompanies", async (req, res) => {
  try {
    const allCompanies = await Company.find({});

    res.send({ data: allCompanies });
  } catch (error) {
    console.log(error);
  }
});

router.put("/updatecompany/:id", (req, res) => {
  const id = req.params.id;
  Company.findByIdAndUpdate(id, {
    companyname: req.body.companyname,
    jobprofile: req.body.jobprofile,
    ctc: req.body.ctc,
    doi: req.body.doi,
    tenthPercentage: req.body.tenthPercentage,
    twelfthPercentage: req.body.twelfthPercentage,
    graduationCGPA: req.body.graduationCGPA,
    sixthSemesterCGPA: req.body.sixthSemesterCGPA,
  })
    .then((company) => res.json(company))
    .catch((err) => res.json(err));
});

router.delete("/deletecompany/:id", (req, res) => {
  const id = req.params.id;
  Company.findByIdAndDelete({ _id: id })
    .then((response) => res.json(response))
    .catch((err) => res.json(err));
});

router.get("/getCompanies/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const company = await Company.findById(id);

    res.send({ data: company });
  } catch (error) {
    console.log(error);
  }
});

router.get("/companyApplicants", async (req, res) => {
  try {
    const companies = await Company.find();

    const companyData = [];

    for (const company of companies) {
      const applicants = await User.find({ appliedCompanies: company._id });

      const companyInfo = {
        companyId: company._id,
        companyName: company.companyname,
        applicants: applicants.map((applicant) => ({
          userId: applicant._id,
          name: applicant.name,
          email: applicant.email,
        })),
      };

      companyData.push(companyInfo);
    }

    res.json(companyData);
  } catch (error) {
    console.error("Error fetching company applicants:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/updatePlacementStatus", async (req, res) => {
  try {
    const { userId, companyId, status } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.placementStatus === "Placed" && status === "Placed") {
      return res.status(200).json({ message: "User is already placed." });
    }
    const company = await Company.findById(companyId);
    console.log(company.companyname);
    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }
    user.placementStatus = status;
    user.companyPlaced = company.companyname;
    await user.save();
    res.json({
      message: `Placement status updated to ${status} successfully.`,
    });
  } catch (error) {
    console.error("Error updating placement status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export { router as UserRouter };
