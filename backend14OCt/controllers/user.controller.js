import { User } from "../models/user.model.js";
import { SavedJobModel, AdminAccessKeyModel, EmployerProfileEditRequestModel, NotificationModel } from "../models/dbModels.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail, sendWelcomeEmail, isEmailConfigured, sendPasswordResetEmail } from "../utils/mailer.js";
import { getTokenFromReq } from "../middleware/isAuthenticated.js";
import crypto from "crypto";

// Simple in-memory OTP store (email -> { otp, expiresAt }). Good enough for a single-instance
// deployment; swap for Redis if you scale to multiple server instances.
const emailOtpStore = new Map();
const verifiedEmailStore = new Map();
// Separate store for "login with OTP" codes, keyed by `${role}:${email}` so it never
// collides with the registration/email-verification OTP flow above.
const loginOtpStore = new Map();
const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const mapDocumentPaths = (documentsObj, uploadedVerificationFiles = [], existingDocs = {}) => {
  const finalDocs = { ...(existingDocs || {}) };
  if (!documentsObj || typeof documentsObj !== "object") return finalDocs;

  Object.entries(documentsObj).forEach(([key, val]) => {
    if (!val) {
      finalDocs[key] = null;
      return;
    }
    if (typeof val === "string" && val.startsWith("/uploads/")) {
      finalDocs[key] = val;
      return;
    }
    const match = uploadedVerificationFiles.find(
      (f) => f.originalname === val || f.originalname.replace(/[^a-zA-Z0-9.-]/g, "-") === val.replace(/[^a-zA-Z0-9.-]/g, "-")
    );
    if (match) {
      finalDocs[key] = `/uploads/${match.filename}`;
    } else if (existingDocs[key] && existingDocs[key].startsWith("/uploads/")) {
      finalDocs[key] = existingDocs[key];
    } else {
      finalDocs[key] = val;
    }
  });
  return finalDocs;
};

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      phoneNumber,
      password,
      pancard,
      adharcard,
      role,
      dateOfBirth,
      companyName,
      gstNumber,
      adminCode,
      profileData, // JSON string: full CandidateResgistration.md / RecruiterRegistration.md payload
    } = req.body;

    // req.files comes from multiUpload (multer .fields()) used by the multi-step wizard.
    // req.file (legacy single-upload) is kept as a fallback for any old caller.
    const files = req.files || {};
    const legacyFile = req.file;
    const fileUrl = (f) => (f && f[0] ? `/uploads/${f[0].filename}` : undefined);

    if (!fullname || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const verifiedRecord = verifiedEmailStore.get(normalizedEmail);
    if (verifiedRecord && Date.now() > verifiedRecord.expiresAt) verifiedEmailStore.delete(normalizedEmail);
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse the rich wizard payload (all fields from the schema docs) if present.
    let parsedProfile = {};
    if (profileData) {
      try {
        parsedProfile = JSON.parse(profileData);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid profileData JSON" });
      }
    }

    const profilePhotoUrl =
      fileUrl(files.profilePhoto) || (legacyFile ? `/uploads/${legacyFile.filename}` : "");
    const resumeFile = files.resume?.[0];

    // Attach uploaded file URLs into the profile blob so nothing is lost.
    const uploadedFiles = {
      profilePhoto: profilePhotoUrl || undefined,
      resume: resumeFile ? `/uploads/${resumeFile.filename}` : undefined,
      resumeOriginalName: resumeFile ? resumeFile.originalname : undefined,
      videoIntro: fileUrl(files.videoIntro),
      companyLogo: fileUrl(files.companyLogo),
      certificationFiles: (files.certificationFiles || []).map((f) => `/uploads/${f.filename}`),
      verificationDocs: (files.verificationDocs || []).map((f) => `/uploads/${f.filename}`),
    };

    // Email is the sole verification channel now (SMS OTP removed). The backend also
    // requires a server-side OTP verification marker for candidate/recruiter registration,
    // so the client cannot bypass email verification by editing the request payload.
    const emailVerified = verifiedEmailStore.has(normalizedEmail);
    if ((role === "Employee" || role === "Recruiter") && !emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email with the OTP before creating your account.",
      });
    }

    if ((role === "Recruiter" || role === "Employee") && parsedProfile.documents) {
      parsedProfile.documents = mapDocumentPaths(parsedProfile.documents, files.verificationDocs || [], {});
    }

    const candidateProfile = role === "Employee" ? { ...parsedProfile, ...uploadedFiles, documents: parsedProfile.documents || {} } : undefined;
    const recruiterProfile = role === "Recruiter" ? { ...parsedProfile, ...uploadedFiles } : undefined;

    const user = await User.create({
      fullname,
      email: normalizedEmail,
      phoneNumber,
      password: hashedPassword,
      pancard,
      adharcard,
      role,

      extraDetails: {
        dateOfBirth: role === "Employee" ? dateOfBirth : "",
        companyName: role === "Recruiter" ? companyName : "",
        gstNumber: role === "Recruiter" ? gstNumber : "",
        adminCode: role === "Admin" ? adminCode : "",
      },

      profile: {
        profilePhoto: profilePhotoUrl || "",
      },

      candidateProfile,
      recruiterProfile,
      verificationStatus: (role === "Admin" || role === "Employee") ? "approved" : "pending",
    });

    verifiedEmailStore.delete(normalizedEmail);

    // Fire-and-forget welcome email — never blocks/breaks registration if it fails.
    sendWelcomeEmail(email, fullname, role).catch((e) => console.log("welcome email failed:", e.message));

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      emailVerified,
      user,
    });
  } catch (error) {
    console.log(error);
    if (error.code === "ER_DUP_ENTRY") {
      let field = "A record";
      if (error.sqlMessage.includes("users.email")) field = "This email";
      if (error.sqlMessage.includes("users.phoneNumber")) field = "This phone number";
      if (error.sqlMessage.includes("users.pancard")) field = "This PAN card";
      if (error.sqlMessage.includes("users.adharcard")) field = "This Aadhar card";
      
      return res.status(400).json({
        success: false,
        message: `${field} is already registered. Please use a different one.`,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= EMAIL OTP (live via Gmail SMTP once GMAIL_USER/GMAIL_PASS are set) ========= */
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const normalizedOtpEmail = String(email).trim().toLowerCase();

    // Check if user (candidate, employer, or admin) with this email already exists
    const existingUser = await User.findOne({ email: normalizedOtpEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const otp = genOtp();
    emailOtpStore.set(normalizedOtpEmail, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    if (!isEmailConfigured()) {
      return res.status(503).json({
        success: false,
        mocked: false,
        message: "SMTP email service is not configured. Please configure GMAIL_USER and GMAIL_PASS before requesting an OTP.",
      });
    }

    await sendOtpEmail(normalizedOtpEmail, otp);
    return res.status(200).json({ success: true, mocked: false, message: "OTP sent to your email" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Could not send OTP email right now" });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "email and otp required" });

    const normalizedOtpEmail = String(email).trim().toLowerCase();
    const record = emailOtpStore.get(normalizedOtpEmail);
    if (!record) return res.status(400).json({ success: false, message: "No OTP was sent to this email" });
    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(normalizedOtpEmail);
      return res.status(400).json({ success: false, message: "OTP expired, please request a new one" });
    }
    if (record.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    emailOtpStore.delete(normalizedOtpEmail);
    verifiedEmailStore.set(normalizedOtpEmail, { verifiedAt: Date.now(), expiresAt: Date.now() + 30 * 60 * 1000 });
    return res.status(200).json({ success: true, message: "Email verified" });
  } catch (error) {
    console.error("verifyEmail Error:", error);
    return res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

/* ================= LOGIN WITH OTP (email, via Gmail SMTP) =================
   Lets a user sign in using a one-time code emailed to them instead of their
   password — useful when the password is forgotten. Same account/session as
   a normal password login. Works for Admin access-key logins too. */
export const sendLoginOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: "Email and role are required" });
    }

    let account = await User.findOne({ email });
    let isAccessKey = false;

    if (!account && role === "Admin") {
      const key = await AdminAccessKeyModel.findByEmail(email);
      if (key) {
        if (!key.is_active) {
          return res.status(403).json({ success: false, message: "This login ID has been revoked by the super admin." });
        }
        account = await User.findById(key.admin_user_id);
        isAccessKey = true;
      }
    }

    if (!account || account.role !== role) {
      // Do not reveal whether the email exists — generic message.
      return res.status(400).json({ success: false, message: "No account found with this email for the selected role." });
    }
    if (account.isBlocked) {
      return res.status(403).json({ success: false, message: "This account has been blocked." });
    }

    const otp = genOtp();
    const storeKey = `${role}:${email}`;
    loginOtpStore.set(storeKey, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    if (!isEmailConfigured()) {
      return res.status(503).json({
        success: false,
        mocked: false,
        message: "SMTP email service is not configured. Please configure GMAIL_USER and GMAIL_PASS before requesting a login OTP.",
      });
    }

    await sendOtpEmail(email, otp);
    return res.status(200).json({ success: true, mocked: false, message: "Login code sent to your email" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Could not send the login code right now" });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    if (!email || !otp || !role) {
      return res.status(400).json({ success: false, message: "Email, code and role are required" });
    }

    const storeKey = `${role}:${email}`;
    const record = loginOtpStore.get(storeKey);
    if (!record) return res.status(400).json({ success: false, message: "No login code was sent to this email. Please request one first." });
    if (Date.now() > record.expiresAt) {
      loginOtpStore.delete(storeKey);
      return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
    }
    if (record.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: "Incorrect code. Please try again." });
    }

    let account = await User.findOne({ email });
    let accessKeyUsed = null;
    if (!account && role === "Admin") {
      const key = await AdminAccessKeyModel.findByEmail(email);
      if (key) {
        if (!key.is_active) {
          return res.status(403).json({ success: false, message: "This login ID has been revoked by the super admin." });
        }
        account = await User.findById(key.admin_user_id);
        accessKeyUsed = key;
      }
    }

    if (!account || account.role !== role) {
      return res.status(400).json({ success: false, message: "No account found with this email for the selected role." });
    }
    if (account.isBlocked) {
      return res.status(403).json({ success: false, message: "This account has been blocked." });
    }

    loginOtpStore.delete(storeKey);
    if (accessKeyUsed) {
      AdminAccessKeyModel.touchLastUsed(accessKeyUsed.id).catch(() => {});
    }

    const token = jwt.sign({ userId: account.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const isProduction = process.env.NODE_ENV === "production";
    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";
    const isAdminLogin = account.role === "Admin" || role === "Admin" || origin.includes("5174") || referer.includes("5174");
    const cookieName = isAdminLogin ? "admin_token" : "token";

    return res
      .status(200)
      .cookie(cookieName, token, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: `Welcome ${account.fullname}`,
        user: account,
      });
  } catch (error) {
    console.error("verifyLoginOtp Error:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user = await User.findOne({ email });
    let accessKeyUsed = null;

    // If no direct account matches this email and an Admin login was requested,
    // check whether this email is a revocable "access key" for a super admin account.
    // A match logs the person into the SAME super admin profile — no separate identity.
    if (!user && role === "Admin") {
      const key = await AdminAccessKeyModel.findByEmail(email);
      if (key) {
        if (!key.is_active) {
          return res.status(403).json({
            success: false,
            message: "This login ID has been revoked by the super admin.",
          });
        }
        const keyPasswordMatches = await bcrypt.compare(password, key.password);
        if (!keyPasswordMatches) {
          return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        user = await User.findById(key.admin_user_id);
        accessKeyUsed = key;
      }
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!accessKeyUsed) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Role mismatch",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by the admin. Please contact support if you think this is a mistake.",
      });
    }

    if (accessKeyUsed) {
      AdminAccessKeyModel.touchLastUsed(accessKeyUsed.id).catch(() => {});
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const isProduction = process.env.NODE_ENV === "production";
    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";
    const isAdminLogin = user.role === "Admin" || role === "Admin" || origin.includes("5174") || referer.includes("5174");
    const cookieName = isAdminLogin ? "admin_token" : "token";

    return res
      .status(200)
      .cookie(cookieName, token, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message: `Welcome ${user.fullname}`,
        user,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  const isFromAdmin = origin.includes("5174") || referer.includes("5174");
  if (isFromAdmin) {
    res.clearCookie("admin_token");
  } else {
    res.clearCookie("token");
  }
  return res.json({ success: true, message: "Logged out" });
};

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills, city, experience, education, role, candidateProfile } = req.body;
    
    // Support both multiUpload and legacy singleUpload
    const files = req.files || {};
    const legacyFile = req.file;
    const fileUrl = (f) => (f && f[0] ? `/uploads/${f[0].filename}` : undefined);

    const userId = req.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    if (bio || email || phoneNumber || legacyFile || skills || city || experience || education || role || files.profilePhoto) {
      if (!user.profile) {
        user.profile = {};
      }
      if (bio) {
        user.profile.bio = bio;
        user.bio = bio;
      }
      if (skills) {
        const skillsArray = Array.isArray(skills)
          ? skills.filter((skill) => skill.trim())
          : skills.split(",").map((skill) => skill.trim()).filter(Boolean);
        user.profile.skills = skillsArray;
        user.skills = skillsArray.join(", ");
      }
      if (city) {
        user.profile.city = city;
        user.city = city;
      }
      if (experience) {
        user.profile.experience = experience;
        user.experience = experience;
      }
      if (education) {
        user.profile.education = education;
        user.education = education;
      }
      if (role) user.profile.role = role;
    }

    const profilePhotoUrl = fileUrl(files.profilePhoto) || (legacyFile ? `/uploads/${legacyFile.filename}` : undefined);
    if (profilePhotoUrl) {
      if (!user.profile) user.profile = {};
      user.profile.profilePhoto = profilePhotoUrl;
      user.profilePhoto = profilePhotoUrl;
    }

    // Process candidateProfile if provided
    if (candidateProfile) {
      try {
        const parsedCandidateProfile = typeof candidateProfile === "string" ? JSON.parse(candidateProfile) : candidateProfile;
        let currentCandProf = typeof user.candidateProfile === "string" ? JSON.parse(user.candidateProfile || "{}") : (user.candidateProfile || {});
        if (currentCandProf.lastAdminEdit) {
          parsedCandidateProfile.lastAdminEdit = { ...currentCandProf.lastAdminEdit, editedByUserSinceAdmin: true };
        }
        
        // Attach files if any were uploaded during edit
        const resumeFile = files.resume?.[0];
        if (resumeFile) {
          user.resume = `/uploads/${resumeFile.filename}`;
          user.resumeOriginalName = resumeFile.originalname;
          parsedCandidateProfile.resume = user.resume;
          parsedCandidateProfile.resumeOriginalName = user.resumeOriginalName;
        } else if (currentCandProf.resume) {
          parsedCandidateProfile.resume = currentCandProf.resume;
          parsedCandidateProfile.resumeOriginalName = currentCandProf.resumeOriginalName || user.resumeOriginalName;
        }

        const videoFile = files.videoIntro?.[0];
        if (videoFile) {
          parsedCandidateProfile.videoIntro = `/uploads/${videoFile.filename}`;
        } else if (currentCandProf.videoIntro) {
          parsedCandidateProfile.videoIntro = currentCandProf.videoIntro;
        }

        if (profilePhotoUrl) {
          parsedCandidateProfile.profilePhoto = profilePhotoUrl;
          if (parsedCandidateProfile.personal) parsedCandidateProfile.personal.photo = profilePhotoUrl;
        }

        // Map and resolve candidate documents
        const currentCandDocs = currentCandProf.documents || {};
        const incomingCandDocs = parsedCandidateProfile.documents || currentCandDocs;
        const resolvedDocs = mapDocumentPaths(incomingCandDocs, files.verificationDocs || [], currentCandDocs);
        parsedCandidateProfile.documents = resolvedDocs;
        parsedCandidateProfile.verificationDocs = Object.values(resolvedDocs).filter((v) => typeof v === "string" && v.startsWith("/uploads/"));

        const mergedCandidateProfile = {
          ...currentCandProf,
          ...parsedCandidateProfile,
          personal: {
            ...(currentCandProf.personal || {}),
            ...(parsedCandidateProfile.personal || {}),
            fullname: fullname || parsedCandidateProfile.personal?.fullname || currentCandProf.personal?.fullname || user.fullname,
            bio: bio || parsedCandidateProfile.personal?.bio || currentCandProf.personal?.bio || user.bio,
            phone: phoneNumber || parsedCandidateProfile.personal?.phone || currentCandProf.personal?.phone || user.phoneNumber,
          },
          contact: {
            ...(currentCandProf.contact || {}),
            ...(parsedCandidateProfile.contact || {}),
            mobile: phoneNumber || parsedCandidateProfile.contact?.mobile || currentCandProf.contact?.mobile || user.phoneNumber,
            email: email || parsedCandidateProfile.contact?.email || currentCandProf.contact?.email || user.email,
          },
          career: {
            ...(currentCandProf.career || {}),
            ...(parsedCandidateProfile.career || {}),
          },
          experience: {
            ...(currentCandProf.experience || {}),
            ...(parsedCandidateProfile.experience || {}),
          },
          education: {
            ...(currentCandProf.education || {}),
            ...(parsedCandidateProfile.education || {}),
          },
          documents: resolvedDocs,
          skills: parsedCandidateProfile.skills || currentCandProf.skills,
          workPrefs: {
            ...(currentCandProf.workPrefs || {}),
            ...(parsedCandidateProfile.workPrefs || {}),
          },
          portfolioLinks: {
            ...(currentCandProf.portfolioLinks || {}),
            ...(parsedCandidateProfile.portfolioLinks || {}),
          },
          platform: {
            ...(currentCandProf.platform || {}),
            ...(parsedCandidateProfile.platform || {}),
          },
        };

        if (mergedCandidateProfile.personal?.photo) {
          user.profilePhoto = mergedCandidateProfile.personal.photo;
          if (!user.profile) user.profile = {};
          user.profile.profilePhoto = mergedCandidateProfile.personal.photo;
        }
        if (mergedCandidateProfile.personal?.fullname) {
          user.fullname = mergedCandidateProfile.personal.fullname;
        }
        if (mergedCandidateProfile.personal?.phone || mergedCandidateProfile.contact?.mobile) {
          user.phoneNumber = mergedCandidateProfile.personal.phone || mergedCandidateProfile.contact.mobile;
        }
        if (mergedCandidateProfile.personal?.bio) {
          user.bio = mergedCandidateProfile.personal.bio;
          if (!user.profile) user.profile = {};
          user.profile.bio = mergedCandidateProfile.personal.bio;
        }
        if (mergedCandidateProfile.personal?.city || mergedCandidateProfile.personal?.address) {
          user.city = mergedCandidateProfile.personal.city || mergedCandidateProfile.personal.address;
        }
        if (mergedCandidateProfile.personal?.religion) {
          user.religion = mergedCandidateProfile.personal.religion;
        }
        if (mergedCandidateProfile.personal?.category) {
          user.category = mergedCandidateProfile.personal.category;
        }
        if (mergedCandidateProfile.personal?.dob || mergedCandidateProfile.personal?.dateOfBirth) {
          user.dateOfBirth = mergedCandidateProfile.personal.dob || mergedCandidateProfile.personal.dateOfBirth;
        }
        if (mergedCandidateProfile.personal?.pan) {
          user.pancard = mergedCandidateProfile.personal.pan;
        }
        if (mergedCandidateProfile.personal?.aadhar) {
          user.adharcard = mergedCandidateProfile.personal.aadhar;
        }
        if (mergedCandidateProfile.education?.qualification || mergedCandidateProfile.education?.degree) {
          user.education = mergedCandidateProfile.education.qualification || mergedCandidateProfile.education.degree;
        }
        if (mergedCandidateProfile.experience?.total || mergedCandidateProfile.experience?.years) {
          user.experience = mergedCandidateProfile.experience.total || `${mergedCandidateProfile.experience.years} Yrs`;
        }
        if (mergedCandidateProfile.skills) {
          const sArr = Array.isArray(mergedCandidateProfile.skills)
            ? mergedCandidateProfile.skills.map(s => typeof s === "object" ? (s.skill || s.name || "") : s).filter(Boolean)
            : String(mergedCandidateProfile.skills).split(",").map(s => s.trim()).filter(Boolean);
          user.skills = sArr.join(", ");
        }
        if (mergedCandidateProfile.career?.expectedCtc || mergedCandidateProfile.career?.salary?.expected || mergedCandidateProfile.career?.salary) {
          user.expectedSalary = mergedCandidateProfile.career?.expectedCtc || mergedCandidateProfile.career?.salary?.expected || mergedCandidateProfile.career?.salary;
        }

        user.candidateProfile = JSON.stringify(mergedCandidateProfile);
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid candidateProfile JSON format" });
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


















































































// import { User } from "../models/user.model.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import getDataUri from "../utils/datauri.js";
// import cloudinary from "../utils/cloud.js";

// export const register = async (req, res) => {
//   try {
//     const { fullname, email, phoneNumber, password, adharcard, pancard, role } =
//       req.body;

//     if (
//       !fullname ||
//       !email ||
//       !phoneNumber ||
//       !password ||
//       !role ||
//       !pancard ||
//       !adharcard
//     ) {
//       return res.status(404).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }
//     const file = req.file;
//     const fileUri = getDataUri(file);
//     const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

//     const user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({
//         message: "Email already exists",
//         success: false,
//       });
//     }
//     const user = await User.findOne({ adharcard });
//     if (adharcard) {
//       return res.status(400).json({
//         message: "Adharnumber already exists",
//         success: false,
//       });
//     }
//     const user = await User.findOne({ pancard });
//     if (pancard) {
//       return res.status(400).json({
//         message: "Pan number already exists",
//         success: false,
//       });
//     }
//     //convert passwords to hashes
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       fullname,
//       email,
//       phoneNumber,
//       adharcard,
//       pancard,
//       password: hashedPassword,
//       role,
//       profile: {
//         profilePhoto: cloudResponse.secure_url,
//       },
//     });

//     await newUser.save();

//     return res.status(200).json({
//       message: `Account created successfully ${fullname}`,
//       success: true,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Server Error registering user",
//       success: false,
//     });
//   }
// };

// export const login = async (req, res) => {
//   try {
//     const { email, password, role } = req.body;

//     if (!email || !password || !adharcard || !role) {
//       return res.status(404).json({
//         message: "Missing required fields",
//         success: false,
//       });
//     }
//     let user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({
//         message: "Incorrect email or password",
//         success: false,
//       });
//     }
//     let user = await User.findOne({ adharcard });
//     if (adharcard) {
//       return res.status(404).json({
//         message: "Incorrect Adhar Number",
//         success: false,
//       });
//     }
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(404).json({
//         message: "Incorrect email or password",
//         success: false,
//       });
//     }
//     //check role correctly or not
//     if (user.role !== role) {
//       return res.status(403).json({
//         message: "You don't have the necessary role to access this resource",
//         success: false,
//       });
//     }

//     //generate token
//     const tokenData = {
//       userId: user._id,
//     };
//     const token = await jwt.sign(tokenData, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     user = {
//       _id: user._id,
//       fullname: user.fullname,
//       email: user.email,
//       phoneNumber: user.phoneNumber,
//       adharcard: user.adharcard,
//       pancard: user.pancard,
//       role: user.role,
//       profile: user.profile,
//     };

//     return res
//       .status(200)
//       .cookie("token", token, {
//         maxAge: 1 * 24 * 60 * 60 * 1000,
//         httpOnly: true,
//         sameSite: "Strict",
//       })
//       .json({
//         message: `Welcome back ${user.fullname}`,
//         user,
//         success: true,
//       });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Server Error login failed",
//       success: false,
//     });
//   }
// };

// export const logout = async (req, res) => {
//   try {
//     return res.status(200).cookie("token", "", { maxAge: 0 }).json({
//       message: "Logged out successfully.",
//       success: true,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

// export const updateProfile = async (req, res) => {
//   try {
//     console.log("Uploaded file:", req.file);
//     console.log("Request body:", req.body);

//     const { fullname, email, phoneNumber, bio, skills } = req.body;
//     const file = req.file;

//     // Check if file is uploaded

//     //cloudinary upload
//     const fileUri = getDataUri(file);
//     const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

//     // Initialize userId at the beginning
//     const userId = req.id; // middleware authentication

//     // Check if userId is valid
//     let user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         message: "User  not found",
//         success: false,
//       });
//     }

//     // Process skills if provided
//     let skillsArray;
//     if (skills) {
//       skillsArray = skills.split(",");
//     }

//     // Update user profile
//     if (fullname) {
//       user.fullname = fullname;
//     }
//     if (email) {
//       user.email = email;
//     }
//     if (phoneNumber) {
//       user.phoneNumber = phoneNumber;
//     }
//     if (bio) {
//       user.profile.bio = bio;
//     }
//     if (skills) {
//       user.profile.skills = skillsArray;
//     }
//     //resume
//     if (cloudResponse) {
//       user.profile.resume = cloudResponse.secure_url;
//       user.profile.resumeOriginalName = file.originalname;
//     }

//     // Save updated user
//     await user.save();

//     user = {
//       _id: user._id,
//       fullname: user.fullname,
//       email: user.email,
//       phoneNumber: user.phoneNumber,
//       role: user.role,
//       profile: user.profile,
//     };

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       user,
//       success: true,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Server Error updating profile",
//       success: false,
//     });
//   }
// };


/* ================= SAVED JOBS ================= */
export const toggleSavedJob = async (req, res) => {
  try {
    const userId = req.id;
    const jobId = req.params.id;
    if (!jobId) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
    }
    const result = await SavedJobModel.toggle(userId, jobId);
    return res.status(200).json({
      success: true,
      message: result.saved ? "Job saved successfully" : "Job removed from saved",
      saved: result.saved
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSavedJobs = async (req, res) => {
  try {
    const userId = req.id;
    const savedJobs = await SavedJobModel.findByUser(userId);
    return res.status(200).json({
      success: true,
      savedJobs
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await User.findByIdAndUpdate(user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: expiry
    });

    const resetLink = `${process.env.FRONTEND_URL || 'https://ardhnarishwar-job-portal.recruweb.com'}/reset-password/${token}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
      return res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email."
      });
    } catch (mailError) {
      console.error("Mailer error:", mailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please contact support or check GMAIL configuration."
      });
    }
  } catch (error) {
    console.error("forgotPassword error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ success: false, message: "Password reset token is invalid or has expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ================= GET PROFILE (SESSION BOOT CHECK) ================= */
export const getProfile = async (req, res) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.json({ success: false, authenticated: false, message: "No session token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.json({ success: false, authenticated: false, message: "Invalid session token" });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.json({ success: false, authenticated: false, message: "User not found" });
    }
    if (user.isBlocked) {
      res.clearCookie("token");
      res.clearCookie("admin_token");
      return res.json({ success: false, authenticated: false, message: "User blocked" });
    }
    return res.json({ success: true, authenticated: true, user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.json({ success: false, authenticated: false, message: "Session expired or invalid" });
  }
};

/* ================= EMPLOYER PROFILE EDIT REQUESTS ================= */
export const requestProfileEdit = async (req, res) => {
  try {
    const userId = req.id;
    const { reason, requestedData } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Reason for edit request is required" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "Recruiter") {
      return res.status(403).json({ success: false, message: "Only recruiters/employers can request profile edits" });
    }

    const existingPending = await EmployerProfileEditRequestModel.findPendingByUser(userId);
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending profile edit request under review by the Admin.",
      });
    }

    const newRequest = await EmployerProfileEditRequestModel.create({
      userId,
      reason: reason.trim(),
      requestedData,
    });

    user.profileEditStatus = "pending";
    user.profileEditReason = reason.trim();
    user.profileEditRemarks = null;
    user.profileEditRequestedAt = new Date();
    await user.save();

    // Create notification for admin
    try {
      const admins = await User.findByRole("Admin");
      for (const admin of admins) {
        await NotificationModel.create({
          recipient: admin.id,
          title: "New Employer Profile Edit Request",
          body: `${user.fullname} (${user.companyName || "Company"}) requested a profile edit. Reason: ${reason.trim()}`,
          type: "admin_request",
          priority: "high",
          meta: { requestId: newRequest.id, employerId: user.id },
        });
      }
    } catch (e) {
      console.error("Failed to notify admins of profile edit request:", e.message);
    }

    return res.status(201).json({
      success: true,
      message: "Profile edit request submitted successfully to Admin.",
      request: newRequest,
      user,
    });
  } catch (error) {
    console.error("requestProfileEdit Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProfileEditStatus = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const latestRequest = await EmployerProfileEditRequestModel.findLatestByUser(userId);

    const status = user.profileEditStatus || "none";
    const reason = user.profileEditReason || (status !== "none" && latestRequest ? latestRequest.reason : null);
    const remarks = user.profileEditRemarks || (status !== "none" && latestRequest ? latestRequest.admin_remarks : null);

    return res.json({
      success: true,
      status,
      reason,
      remarks,
      request: latestRequest,
    });
  } catch (error) {
    console.error("getProfileEditStatus Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clearProfileEditStatus = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.profileEditStatus = "none";
    user.profileEditReason = null;
    user.profileEditRemarks = null;
    await user.save();

    try {
      await EmployerProfileEditRequestModel.markCompletedByUser(userId);
    } catch (e) {
      console.error("markCompletedByUser Error:", e);
    }

    return res.json({
      success: true,
      message: "Status cleared successfully",
      user,
    });
  } catch (error) {
    console.error("clearProfileEditStatus Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateRecruiterProfile = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);

    if (!user || user.role !== "Recruiter") {
      return res.status(403).json({ success: false, message: "Only recruiters can update employer profiles" });
    }

    // Permission-based editing check
    const latestRequest = await EmployerProfileEditRequestModel.findLatestByUser(userId);
    const isApproved = user.profileEditStatus === "approved" || latestRequest?.status === "approved";

    if (!isApproved) {
      return res.status(403).json({
        success: false,
        message: "Profile editing is locked. You must submit an Edit Request and get Admin approval first.",
      });
    }

    const { profileData, companyName, gstNumber, fullname, phoneNumber } = req.body;
    const files = req.files || {};
    const fileUrl = (f) => (f && f[0] ? `/uploads/${f[0].filename}` : undefined);

    let parsedProfile = {};
    if (profileData) {
      try {
        parsedProfile = typeof profileData === "string" ? JSON.parse(profileData) : profileData;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid profileData format" });
      }
    }

    let currentRecruiterProfile = {};
    try {
      currentRecruiterProfile = typeof user.recruiterProfile === "string"
        ? JSON.parse(user.recruiterProfile)
        : (user.recruiterProfile || {});
    } catch (e) {}

    const uploadedFiles = {
      profilePhoto: fileUrl(files.profilePhoto) || currentRecruiterProfile.profilePhoto,
      companyLogo: fileUrl(files.companyLogo) || currentRecruiterProfile.companyLogo,
      verificationDocs: files.verificationDocs?.length
        ? (files.verificationDocs || []).map((f) => `/uploads/${f.filename}`)
        : currentRecruiterProfile.verificationDocs,
    };

    const resolvedDocuments = mapDocumentPaths(
      parsedProfile.documents || currentRecruiterProfile.documents,
      files.verificationDocs || [],
      currentRecruiterProfile.documents || {}
    );

    const updatedLastAdminEdit = currentRecruiterProfile.lastAdminEdit
      ? { ...currentRecruiterProfile.lastAdminEdit, editedByUserSinceAdmin: true }
      : undefined;

    const updatedRecruiterProfile = {
      ...currentRecruiterProfile,
      ...parsedProfile,
      documents: resolvedDocuments,
      lastAdminEdit: updatedLastAdminEdit,
      company: {
        ...(currentRecruiterProfile.company || {}),
        ...(parsedProfile.company || {}),
      },
      contact: {
        ...(currentRecruiterProfile.contact || {}),
        ...(parsedProfile.contact || {}),
      },
      address: {
        ...(currentRecruiterProfile.address || {}),
        ...(parsedProfile.address || {}),
      },
      hiring: {
        ...(currentRecruiterProfile.hiring || {}),
        ...(parsedProfile.hiring || {}),
      },
      billing: {
        ...(currentRecruiterProfile.billing || {}),
        ...(parsedProfile.billing || {}),
      },
      ...uploadedFiles,
    };

    if (companyName) user.companyName = companyName;
    else if (updatedRecruiterProfile.company?.name) user.companyName = updatedRecruiterProfile.company.name;

    if (gstNumber) user.gstNumber = gstNumber;

    const updatedFullName = fullname || updatedRecruiterProfile.contact?.fullname || updatedRecruiterProfile.company?.name;
    if (updatedFullName && typeof updatedFullName === "string" && updatedFullName.trim()) {
      user.fullname = updatedFullName.trim();
    }

    const updatedPhone = phoneNumber || updatedRecruiterProfile.contact?.mobile || updatedRecruiterProfile.company?.mobile;
    if (updatedPhone && typeof updatedPhone === "string" && updatedPhone.trim()) {
      user.phoneNumber = updatedPhone.trim();
    }

    const updatedPhoto = uploadedFiles.companyLogo || uploadedFiles.profilePhoto || updatedRecruiterProfile.companyLogo || updatedRecruiterProfile.profilePhoto;
    if (updatedPhoto && typeof updatedPhoto === "string" && updatedPhoto.trim()) {
      user.profilePhoto = updatedPhoto.trim();
    }

    user.recruiterProfile = JSON.stringify(updatedRecruiterProfile);

    // Reset status after successful edit
    user.profileEditStatus = "none";
    user.profileEditReason = null;
    user.profileEditRemarks = null;

    await user.save();
    await EmployerProfileEditRequestModel.markCompletedByUser(userId);

    return res.json({
      success: true,
      message: "Employer profile updated successfully!",
      user,
    });
  } catch (error) {
    console.error("updateRecruiterProfile Error:", error);
    return res.status(500).json({ success: false, message: "Server error during profile update" });
  }
};
