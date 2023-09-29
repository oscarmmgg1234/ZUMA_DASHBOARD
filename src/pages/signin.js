// import { useState } from "react"
// import { signIn, getSession } from "next-auth/react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

// export default function Login(){

//     const [formData, setFormData] = useState({
//         password: "",
//         email: "",
//         showPassword: true,
//     });

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         await signIn("credentials", {
//             redirect: true,
//             email: formData.email,
//             password: formData.password,
//             callbackUrl: "http://34.220.205.154:3000/"
//         }); // Replace this with your form submission logic
//     };    

//     const TogglePasswordVisibility = () => {
//         setFormData({ ...formData, showPassword: !formData.showPassword });
//     };

//     const passwordInputType = formData.showPassword ? "password" : "text";
//     const passwordIcon = formData.showPassword ? faEyeSlash : faEye;

//     return(
//         <>
            
//             <div className="w-screen h-screen bg-zuma-green flex justify-center items-center">
           
//                 <form onSubmit={handleSubmit} className="max-w-md">
//                 <div className="max-w-md flex flex-col items-center justify-center mb-20">
//                 <div className="text-zuma-login text-8xl font-bold">ZUMA</div>
//                 </div>
//                     <h2 className="text-2xl font-bold mb-8">Sign in to your admin dashboard!</h2>
//                     <div className="mb-4">
//                         <label htmlFor="email" className="block font-bold mb-2">
//                         Email
//                         </label>
//                         <input
//                             type="email"
//                             id="email"
//                             name="email"
//                             value={formData.name}
//                             onChange={(e)=>{setFormData({...formData, email: e.target.value})}}
//                             className="w-full border-2 border-zuma-login/50 p-2 rounded-md text-black"
//                         />
//                     </div>
//                     <div className="mb-4">
//                         <label htmlFor="password" className="block font-bold mb-2">
//                         Password
//                         </label>
//                         <div className="relative">
//                         <input
//                             type={passwordInputType}
//                             id="password"
//                             name="password"
//                             value={formData.password}
//                             onChange={(e)=>{setFormData({...formData, password: e.target.value})}}
//                             className="w-full border-2 border-zuma-login/50  p-2 rounded-md text-black pr-10"
//                         />
//                         <button
//                             type="button"
//                             className="absolute right-2 top-2 h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
//                             onClick={TogglePasswordVisibility}
//                         >
//                             <FontAwesomeIcon icon={passwordIcon} />
//                         </button>
//                         </div>
//                     </div>
//                     <button
//                         type="submit"
//                         className="bg-gradient-to-b from-orange-400 to-orange-600/80 hover:to-orange-500/80text-white py-2 px-4 rounded-md hover:bg-blue-600"
//                     >
//                         Sign in with credentials 
//                     </button>
//                 </form>
//             </div>
//         </>
//     )
// }

// export async function getServerSideProps(context) {
//     const session = await getSession(context);
    
//     // If user has an active session, redirect to home page
//     if (session && session.accessToken) {
//         return {
//             redirect: {
//                 destination: "/",
//                 permanent: false,
//             },
//         };
//     }
    
//     // If user does not have a session, continue rendering the login page
//     return {
//         props: {},
//     };
// }
