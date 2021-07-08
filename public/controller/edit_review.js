import * as FirebaseController from './firebase_controller.js'
import * as Util from '../viewpage/util.js'
import * as Constant from '../model/constant.js'
import * as Element from '../viewpage/element.js'
import * as Auth from './auth.js'

function isAdmin(email){
    return Constant.adminEmails.includes(email);
}

export async function delete_review(docId, userEmail){
    
    if(Auth.currentUser.email == userEmail || isAdmin(Auth.currentUser.email) ){
            try{
            // calls firebase controller to delete review with docId, which calls cf_deleteReview
            await FirebaseController.deleteReview(docId)
            //updates browser
            const cardTag = document.getElementById('card-'+docId);
            cardTag.remove();
            Util.info('Success', `Review has been deleted by ${Auth.currentUser.email}`)
        }catch(e){
            if(Constant.DEV) console.log(e);
            Util.info('Delete review error', JSON.stringify(e))
        }
    }else{
        Util.info('Error', 'Cannot delete other User\'s Reviews')
         return;
    }

   
}

