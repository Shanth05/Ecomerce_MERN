import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import uploadImageCloudinary  from '../utils/uploadImageCloudinary.js'
import generatedOtp from '../utils/generatedOtp.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'


export async function registerUserController(request,response) {
    try{
        const { name, email, password } = request.body

         // Input validation
        if(!name || !email || !password){
            return response.status(400).json({
                message : "provide email,name,password",
                error : true,
                sucess : false
            })
        }

        // Check if user already exists
        const user = await UserModel.findOne({email})

        if(user){
            return response.json({
                message: "Already register email",
                error : true,
                success : false
            })
        }

         // Hash password
        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password,salt)

        const payload = {
            name,
            email,
            password : hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()
        const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

        const verifyEmail = await sendEmail({
            sendTo : email,
            subject : " Verify email from Ecom",
            html : verifyEmailTemplate ({
                name,
                url : verifyEmailUrl
            })
        })

        return response.json({
            message : "User register successfully",
            error : false,
            success :true,
            data : save
        })

    } catch(error){
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function verifyEmailController(request,response) {
    try {
        const {code} = request.body

        const user = await UserModel.findOne({_id : code})
        if(!user){
            return response.status(400).json({
                message : "Invalid code",
                error : true,
                success : false
            })
        }

        const updateUser = await UserModel.updateOne({_id : code},{
            verify_email : true
        })

        return response.status(400).json({
            message : "Verification email done",
            success : true,
            error: false
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : true
        })
    }   
}

export async function loginController (request,response){
    try {
        const{email,password} = request.body

        if(!email || !password){
            return response.status(400).json({
                message : "Provide email, password",
                error: true,
                success: false
            })
        }

        const user = await UserModel.findOne({email})

        if(!user){
            return response.status(500).json({
                message : "User not register",
                error: true,
                success: false
            })
        }

        if(user.status !== "Active" ){
            return response.status(400).json({
                message : "Contact to Admin",
                error: true,
                success: false
            })
        }

        const checkPassword = await bcryptjs.compare(password,user.password)

        if(!checkPassword){
            return response.status(400).json({
                message : "Check your password",
                error: true,
                success: false
            })
        }

        //access token
        const accessToken = await generatedAccessToken(user._id)
        const refreshToken = await generatedRefreshToken(user._id)

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.cookie('accessToken',accessToken,cookiesOption)
        response.cookie('refreshToken',refreshToken,cookiesOption)

        return response.json({
            message : "Login Successfully",
            error: false,
            success: true,
            data : {
                accessToken,
                refreshToken
            }
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error: true,
            success: false
        })
    }
}

export async function logoutController(request,response) {
    try {

        const userid = request.userId //middleware

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.clearCookie("accessToken",cookiesOption,)
        response.clearCookie("refreshToken",cookiesOption,)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
            refresh_token : ""
        })

        return response.json({       
            message : "Logout Successfully",
            error : false,
            success : true
           
        })

    } catch (error) {
        return response.status(500),json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function uploadAvatar(request,response){
    try {
        const userId = request.userId // auth middlware
        const image = request.file //multer middlware

        const upload = await uploadImageCloudinary(image)

        const updateUser = await UserModel.findByIdAndUpdate(userId,{
            avatar : upload.url
        })

        return response.json({
            message : "update profile",
            data : {
                _id : userId,
                avatar : upload.url
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            sucess : false
        })
    }
}

export async function updateUserDetails(request,response) {
    try {
        const userId = request.userId //auth middleware
        const { name, email, mobile, password } = request.body

        let hashPassword = ""

        if(password){
            const salt = await bcryptjs.genSalt(10)
            const hashPassword = await bcryptjs.hash(password,salt)    
        }

        const updateUser = await UserModel.updateOne({ _id : userId },{
            ...(name && { name : name}),
            ...(email && { email : email}),
            ...(mobile && { mobile : mobile}),
            ...(password && { password : hashPassword})
        })

        return response.json({
            message : "update user successfully",
            error : false,
            success : true,
            data : updateUser
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body;

        // Check if user exists with the provided email
        const user = await UserModel.findOne({ email });

        // If user does not exist, return an error response
        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true,
                success: false
            });
        }

        // Generate OTP
        const otp = generatedOtp();
        const expireTime = new Date() + 60 * 60 * 1000; // OTP expiry time (1 hour)

        // Update user document with OTP and expiry time
        const update = await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: otp,
            forgot_password_expiry: new Date(expireTime).toISOString()
        });

        // Send OTP email to the user
        await sendEmail({
            sendTo: email,
            subject: "Forgot password from Ecom",
            html: forgotPasswordTemplate({
                name: user.name,
                otp: otp
            })
        });

        // Return success response
        return response.json({
            message: "Check your email for OTP",
            error: false,
            success: true
        });

    } catch (error) {
        // Handle any errors that occur during the process
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email,otp } = request.body

        if (!email || !otp) {
            return response.status(400).json({
                message: "Provided required field email,otp",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email })

        if (!user) {
            return response.status(400).json({
                message: "Email not available",
                error: true,
                success: false
            });
        }
        
        const currentTime = new Date().toISOString()

        if (user.forgot_password_expiry < currentTime) {
            return response.status(400).json({
                message: "OTP is expired",
                error: true,
                success: false
            });
        }

        if (otp !== user.forgot_password_otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }

        //if otp is not expired
        //otp === user.forgot_password_otp
        return response.status(200).json({
            message : "Verify OTP Successfully",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function resetPassword(request, response) {
    try {
        
        const { email, newPassword, confirmPassword } = request.body

        if(!email || !newPassword || !confirmPassword){
            return response.status(400).json({
                message : "Provide required fields email,newPassword,confirmPassword"
            })
        }

        const user = await UserModel.findOne({email})

        if(!user){
            return response.status(400).json({
                message : "Email is not available",
                error: true,
                success: false
            })
        }

        if(newPassword !== confirmPassword){
            return response.status(400).json({
                message : "New password and Confirm Password must be same.",
                error: true,
                success: false
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(newPassword,salt)

        const update = await UserModel.findByIdAndUpdate(user._id,{
            password : hashPassword
        })

        return response.json({
            message : "Password updated successfully",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function refreshToken(request, response) {
    try {

        const refreshToken = request.cookies.refreshToken || request?.header?.authorization?.split(" ")[1] //[ Bearer token ]
        
        if(!refreshToken){
            return response.status(401).json({
                message : "Invalid token",
                error : true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN)

        if(!verifyToken){
            return response.status(401).json({
                message : "Token is expired",
                error : true,
                success : false
            })
        }

        const userId = verifyToken?.id

        const newAccessToken = await generatedAccessToken(userId)

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message : "New Access token generated",
            error : false,
            success : true,
            data : {
                accessToken : newAccessToken
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}