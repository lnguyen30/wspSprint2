import * as Element from '../viewpage/element.js'
import * as FirebaseController from './firebase_controller.js'
import * as Constant from '../model/constant.js'
import * as Util from '../viewpage/util.js'
import * as Route from './route.js'
import * as Profile from '../viewpage/profile_page.js'
import * as Home from '../viewpage/home_page.js'



export let currentUser;

export function addEventListeners() {
  // after signing in from modal
  Element.formSignin.addEventListener("submit", async (e) => {
    //listens to sign in form when sign in form button is clicked
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    //    //to enable/disable button for sign in
    //    const button = e.target.getElementsByTagName('button')[0];
    //    const label = Util.disableButton(button);

    try {
      await FirebaseController.signIn(email, password);
      Element.modalSignin.hide();
    } catch (e) {
      if (Constant.DEV) console.log(e);
      Util.info("Sign In Error", JSON.stringify(e), Element.modalSignin);
    }
    //    Util.enableButton(button, label);
  });

  Element.menuSignOut.addEventListener("click", async () => {
    try {
      await FirebaseController.signOut();
    } catch (e) {
      if (Constant.DEV) console.log(e);
      Util.info("Sign Out Error", JSON.stringify(e));
    }
  });

  //changes state of page based on user signing in/out
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user && Constant.adminEmails.includes(user.email)) {

     await Profile.getAccountInfo(user);  
      //if admins signs in, display the post admins auth buttons
      currentUser = user;
      let elements = document.getElementsByClassName("modal-pre-auth"); //sign in button
      let signOutElement = document.getElementsByClassName("modal-post-auth"); //sign out button
      // hides sign in button
      for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
      }
      //displays admin navbar buttons, then signout button
      elements = document.getElementsByClassName("modal-admin-post-auth");
      for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = "block";
      }
      for (let i = 0; i < signOutElement.length; i++) {
        signOutElement[i].style.display = "block";
      }
    } else if (user) {
      await Profile.getAccountInfo(user);  

      //if user signs in
      currentUser = user;

      //when user signs in, shopping cart will be initialized
      Home.initShoppingCart();

      let elements = document.getElementsByClassName("modal-pre-auth");
      let signOutElement = document.getElementsByClassName("modal-post-auth");
      // hides sign in button
      for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
      }
      //displays user navbar buttons, then signout button
      elements = document.getElementsByClassName("modal-user-post-auth");
      for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = "block";
      }
      for (let i = 0; i < signOutElement.length; i++) {
        signOutElement[i].style.display = "block";
      }

      //maintains pathname once signed in
      Route.routing(window.location.pathname, window.location.hash);
    } else {
      //if user/admin signs out
      currentUser = null;
      let elements = document.getElementsByClassName("modal-pre-auth");
      let signOutElement = document.getElementsByClassName("modal-post-auth");
      let userElements = document.getElementsByClassName(
        "modal-user-post-auth"
      );
      let adminElements = document.getElementsByClassName(
        "modal-admin-post-auth"
      );
      //show sign in button
      for (let i = 0; i < elements.length; i++) {
        elements[i].style.display = "block";
      }
      //hides user and admin navbar buttons and then signout button
      for (let i = 0; i < userElements.length; i++) {
        userElements[i].style.display = "none";
      }
      for (let i = 0; i < adminElements.length; i++) {
        adminElements[i].style.display = "none";
      }
      for (let i = 0; i < signOutElement.length; i++) {
        signOutElement[i].style.display = "none";
      }

      //defaults home path after signing out
      history.pushState(null, null, Route.routePathname.HOME);
      //maintains pathname once signed in
      Route.routing(window.location.pathname, window.location.hash);
    }
  });

  // displays sign up modal after click event
  Element.buttonSignup.addEventListener("click", () => {
    // close sign in modal
    Element.modalSignin.hide();
    //rests sign up form
    Element.formSignup.reset();
    //resets error message
    Element.formSignupPasswordError.innerHTML = "";
    //displays signup modal
    Element.modalSignup.show();
  });

  Element.formSignup.addEventListener("submit", async (e) => {
    e.preventDefault();
    //assigns values from sign up form
    const email = e.target.email.value;
    const password = e.target.password.value;
    const passwordConfirm = e.target.passwordConfirm.value;

    //resets error form
    Element.formSignupPasswordError.innerHTML = "";
    //error message when two passwords /=
    if (password != passwordConfirm) {
      Element.formSignupPasswordError.innerHTML = "Two passwords do not match";
      return;
    }

    try {
      await FirebaseController.createUser(email, password);
      Util.info(
        "Account Created",
        `You are now signed in as ${email}`,
        Element.modalSignup
      );
    } catch (e) {
      if (Constant.DEV) console.log(e);
      Util.info(
        "Fail to create new account",
        JSON.stringify(e),
        Element.modalSignup
      );
    }
  });
}
