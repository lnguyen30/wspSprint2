import * as Element from './element.js'
import * as Route from '../controller/route.js'
import * as FirebaseController from '../controller/firebase_controller.js'
import * as Constant from '../model/constant.js'
import * as Util from './util.js'
import * as Auth from '../controller/auth.js'


//event listeners for profile page
export function addEventListeners(){
    Element.menuProfile.addEventListener('click', async ()=>{
        history.pushState(null, null, Route.routePathname.PROFILE);

        await profile_page();
    })
}

// profile page default state
export async function profile_page(){
    let html ='<h1>Profile Page</h1>'

    //if user hasn't signed in
    if(!Auth.currentUser){
        html +='<h2>Protected Page</h2>'
        Element.root.innerHTML = html;
        return;
    }
    // if account doesn't exist
    if(!accountInfo){
        html += `<h2>Failed to retrieve account info for ${Auth.currentUser.email} </h2>`
        Element.root.innerHTML = html;
        return;
    }
    //displays account info's email and other info
    html += `
        <div class="alert alert-primary">
            Email: ${Auth.currentUser.email} (cannot change email as login name)
        </div>
    `;

    html +=`
        <form class="form-profile" method="post">
            <table class="table table-sm">
            <tr>
                <td width="15%">Name:</td>
                <td width="60%">
                    <input type="text" name="name" value="${accountInfo.name}"
                        placeholder="firstname lastname" disabled required
                        pattern="^[A-Za-z][A-Za-z|'|-| ]+">
                </td>
                <td>${actionButtons()}</td>
            </tr>
            </table>
        </form>
    `;

    html +=`
    <form class="form-profile" method="post">
        <table class="table table-sm">
        <tr>
            <td width="15%">Address:</td>
            <td width="60%">
                <input type="text" name="address" value="${accountInfo.address}"
                    placeholder="Address" disabled required
                    minlength="2">
            </td>
            <td>${actionButtons()}</td>
        </tr>
        </table>
    </form>
`;

html +=`
<form class="form-profile" method="post">
    <table class="table table-sm">
    <tr>
        <td width="15%">City:</td>
        <td width="60%">
            <input type="text" name="city" value="${accountInfo.city}"
                placeholder="City" disabled required
                minlength="2">
        </td>
        <td>${actionButtons()}</td>
    </tr>
    </table>
</form>
`;

html +=`
<form class="form-profile" method="post">
    <table class="table table-sm">
    <tr>
        <td width="15%">State:</td>
        <td width="60%">
            <input type="text" name="state" value="${accountInfo.state}"
                placeholder="State (uppercase 2 letter state code)" disabled required
                pattern ="[A-Z]+"
                minlength="2">
        </td>
        <td>${actionButtons()}</td>
    </tr>
    </table>
</form>
`;

html +=`
<form class="form-profile" method="post">
    <table class="table table-sm">
    <tr>
        <td width="15%">Zip:</td>
        <td width="60%">
            <input type="text" name="zip" value="${accountInfo.zip}"
                placeholder="5 digit zip code" disabled required
                pattern ="[0-9]+"
                minlength="5" maxlength="5">
        </td>
        <td>${actionButtons()}</td>
    </tr>
    </table>
</form>
`;


html +=`
<form class="form-profile" method="post">
    <table class="table table-sm">
    <tr>
        <td width="15%">Credit Card #:</td>
        <td width="60%">
            <input type="text" name="creditNo" value="${accountInfo.creditNo}"
                placeholder="credit card number 16 digits" disabled required
                pattern ="[0-9]+"
                minlength="16" maxlength="16">
        </td>
        <td>${actionButtons()}</td>
    </tr>
    </table>
</form>
`;

//profile page
html += `
    <table>
        <tr>
            <td>
                <input type="file" id="profile-photo-upload-button" value="upload">
            </td>
            <td>
                <img id="profile-img-tag" src="${accountInfo.photoURL}" class="rounded-circle" width="250px">
            </td>
            <td>
                <button id="profile-photo-update-button" class="btn btn-outline-danger">Update Photo</button>
            </td>
            <td>
                <button id="update-password-button" class="btn btn-outline-info">Update Password</button>
            </td>
        </tr>
    </table>
`

    Element.root.innerHTML = html;
    //global var for photo file
    let photoFile;

    const updateProfilePhotoButton = document.getElementById('profile-photo-update-button');
    // event listener to update profile picture
    updateProfilePhotoButton.addEventListener('click', async () =>{
        if(!photoFile){
            Util.info('No Photo Selected', 'Choose a profile photo');
            return;
        }
        const label = Util.disableButton(updateProfilePhotoButton);
        try{
            const photoURL = await FirebaseController.uploadProfilePhoto(photoFile, Auth.currentUser.uid);
            // updates  account info with photoURL
            await FirebaseController.updateAccountInfo(Auth.currentUser.uid, {photoURL})
            //updates the account info's photo url with photoURL from firebase
            accountInfo.photoURL = photoURL;
             //updates user's profile pic
             Element.menuProfile.innerHTML = `
             <img src=${accountInfo.photoURL} class="rounded-circle" height="30px">
            `;

            Util.info('Success', 'Profile Photo Updated')
        }catch(e){
            if(Constant.DEV) console.log(e);
            Util.info('Photo update error', JSON.stringify(e))
        }

        Util.enableButton(updateProfilePhotoButton, label);
    })
    //event listener to retrieve and store photo
    document.getElementById('profile-photo-upload-button').addEventListener('change', e =>{
        photoFile = e.target.files[0];
        if(!photoFile) {
            document.getElementById('profile-img-tag').src = accountInfo.photoURL;
            return;
        }
        const reader = new FileReader();
        //preview img
        reader.onload = () =>document.getElementById('profile-img-tag').src = reader.result
        reader.readAsDataURL(photoFile);
    })

    //collects all forms from profile page
    const forms = document.getElementsByClassName('form-profile');
    for( let i = 0; i<forms.length; i++){
        forms[i].addEventListener('submit', async e =>{
            e.preventDefault();
            //grabs all buttons as an array
            const buttons = e.target.getElementsByTagName('button')
            //grabs field to update info
            const inputTag = e.target.getElementsByTagName('input')[0];
            //assigns buttonLabel variable with the button that was clicked
            const buttonLabel = e.target.submitter;
            // key value pair to use to update acct info
            const key = inputTag.name;
            const value = inputTag.value;

            if(buttonLabel == 'Edit'){
                //hides button
                buttons[0].style.display = 'none';
                //shows other buttons
                buttons[1].style.display = 'inline-block';
                buttons[2].style.display = 'inline-block';
                //re-enables field to update
                inputTag.disabled = false;
            }else if( buttonLabel == 'Update'){
                const updateInfo = {}; //updateInfo.key = value;
                updateInfo[key] = value;
                const label = Util.disableButton(buttons[1]);
                try{
                    await FirebaseController.updateAccountInfo(Auth.currentUser.uid, updateInfo);
                    // updates current account info to web browser
                    accountInfo[key] = value;
                }catch(e){
                    if(Constant.DEV) console.log(e)
                    Util.info(`Update Error ${key}`, JSON.stringify(e) )

                }
                Util.enableButton(buttons[1], label)
                buttons[0].style.display = 'inline-block';
                buttons[1].style.display = 'none';
                buttons[2].style.display = 'none';
                inputTag.disabled = true;
            }else{
                buttons[0].style.display = 'inline-block';
                buttons[1].style.display = 'none';
                buttons[2].style.display = 'none';
                inputTag.disabled = true;
                //original value if cancel button is clicked
                inputTag.value = accountInfo[key]
            }
        })
    }


    //update password button event listener from profile page/modal
   document.getElementById('update-password-button').addEventListener('click', () =>{

        Element.formUpdatePassword.reset();
        Element.formUpdatePasswordError.innerHTML = '';
        Element.modalUpdatePassword.show();

    })

    //update password, re-authenticate with old password
    Element.formUpdatePassword.addEventListener('submit', async e =>{
        e.preventDefault()
        const email = Auth.currentUser.email; //users email
        const oldPassword = e.target.oldPassword.value; //old password of current user
        const newPassword = e.target.newPassword.value; // new password
        const passwordConfirm = e.target.passwordConfirm.value; // password confirmation
        Element.formUpdatePasswordError.innerHTML = '' // error reset
        if (newPassword != passwordConfirm){
            Element.formUpdatePasswordError.innerHTML = 'Passwords do not match'
            return;
        }

        // //re-authenticates user
        // try {
        //     await FirebaseController.signIn(email, oldPassword);
        //   } catch (e) {
        //     if (Constant.DEV) console.log(e);
        //     Util.info("Sign In Error", JSON.stringify(e), Element.modalUpdatePassword);
        //   }


        //updates password to firebasecontroller
        try{
            await FirebaseController.updatePassword(newPassword)
            Util.info('Success', 'Password Updated', Element.modalUpdatePassword)
        }catch(e){
            if(Constant.DEV) console.log(e);
            Util.info('Failed to update password', JSON.stringify(e), Element.modalUpdatePassword);
        }

         //re-authenticates user
         try {
            await FirebaseController.signIn(email, newPassword);
          } catch (e) {
            if (Constant.DEV) console.log(e);
            Util.info("Re-Authentication Error", JSON.stringify(e), Element.modalUpdatePassword);
          }
    })
}

function actionButtons(){
    //submitter will restore label 
    // index 0: Edit, 1: Update, 2: Cancel
    return`
    <button onclick="this.form.submitter='Edit'"
         type="submit" class="btn btn-outline-primary">Edit</button>
    <button onclick="this.form.submitter='Update'"
        type="submit" class="btn btn-outline-danger" style="display: none;">Update</button>
    <button onclick="this.form.submitter='Cancel'" formnovalidate="true"
         type="submit" class="btn btn-outline-secondary" style="display: none;">Cancel</button>
    `;
}

//global variable for account info
let accountInfo;
// client side retrieving 
export async function getAccountInfo(user){
    
    try{
        // firebase fetches the user's info with the user's uid
        accountInfo = await FirebaseController.getAccountInfo(user.uid)
    }catch(e){
        if(Constant.DEV) console.log(e);
        Util.info(`Failed to retrieve account info for ${user.email}`, JSON.stringify(e));
        accountInfo = null;
        return;
    }
    //updates user's profile pic
    Element.menuProfile.innerHTML = `
        <img src=${accountInfo.photoURL} class="rounded-circle" height="30px">
    `;

}