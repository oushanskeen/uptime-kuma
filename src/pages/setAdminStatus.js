export default function setAdminStatus () {

	console.log("setAdminStatus", import.meta.env);
	import.meta.env.VITE_ADMIN = true
	console.log("setAdminStatus", import.meta.env);
   // console.log("setAdminStatus", process.env.NODE_ENV);
   // console.log("setAdminStatus", process.env.NODE_ENV);

// if(process.env.NODE_ENV === 'production'){
//   console.log('App running in production mode');
// }

// 	console.log("setAdminStatus: ", process)
	// process.env.Admin = true
}