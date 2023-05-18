

<script type="text/javascript">
import setAdminStatus from "./setAdminStatus.js"
	export default {
		data() {
			// this.$root.AAA = "A-A-A"
			// console.log("THIS ROOT: ", Object.keys(this.$root))
			// console.log("THIS ROOT AAA: ", this.$root.AAA)
			return {
				adminStatus: false,
				passphrase: "",
				adminStatus: "adminIdRequired"
			}
		},
		watch: {
			// "adminIdRequired"(){
			// 	console.log("Attempt to enter as admin")
			// }
		},
		methods: {
			handleSetAdmin() {
				// import.meta.env.VITE_ADMIN  = !import.meta.env.VITE_ADMIN
				// import.meta.env.VITE_ADMIN  = true 
				// app.appContext.config.globalProperties.foo = 'bar';
				// console.log("app.config: ",app.appContext.config.globalProperties)
				// setAdminStatus()
				// console.log("AAAAADMIN: ", import.meta.env)
				let result = localStorage.getItem('storedData') == "true" ? true : false
                console.log("localStorage.getItem('storedData'): ", result)
                console.log("new localStorage.getItem('storedData'): ", !result)
				localStorage.setItem('storedData', !result)

			},
			handleGetAdmin() {
				// import.meta.env.ADMIN = !import.meta.env.ADMIN
				console.log("localStorage.getItem('storedData'): ", localStorage.getItem('storedData'))
				// console.log("AAAAADMIN: ", import.meta.env.ADMIN)
			},
			// comparePassphrase(e, passphrase += e.target.value){
			comparePassphrase(e){
				console.log("import.meta.env: ", import.meta.env)
				this.adminIdRequired = Math.random()
				console.log("ACTION: ", e.target.value)
				if(e.target.value == import.meta.env.VITE_PASSPHRASE){
					localStorage.setItem('isAdminHere', 'admin is here')
					this.$router.push("/dashboard/1");
				}else{
					localStorage.setItem('isAdminHere','someone attempted to mimic admin')
				}
			    this.adminStatus = localStorage.getItem('isAdminHere')
				console.log("Admin status: ", localStorage.getItem('isAdminHere'))
			}
		}
	}
</script>

<template>
	<div>
	    <input type="text" :value="passphrase" @change="comparePassphrase" autofocus autocomplete placeholder="enter passphrase">
	    <h3>{{ adminStatus }}</h3>
	</div>
	 <div class="form-container">
        <div class="form">
            <form @submit.prevent="submit">
                <h1 class="h3 mb-3 fw-normal" />

                <!--
                <div>
                    <div class="form-floating mt-3">
                        <input id="otp" v-model="token" type="text" maxlength="6" class="form-control" placeholder="123456">
                        <label for="otp">{{ $t("Token") }}</label>
                    </div>
                </div>

                <button class="w-100 btn btn-primary" type="submit" :disabled="processing">
                    {{ $t("Enter") }}
                </button>
                -->

            </form>
        </div>
    </div>
</template>