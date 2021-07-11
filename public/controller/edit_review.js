import * as FirebaseController from './firebase_controller.js'
import * as Util from '../viewpage/util.js'
import * as Constant from '../model/constant.js'
import * as Element from '../viewpage/element.js'
import * as Auth from './auth.js'
import { Review } from '../model/review.js'
import * as Details from '../viewpage/details_page.js'

function isAdmin(email){
    return Constant.adminEmails.includes(email);
}


export function addEventListeners(){
    //event listener for review modal form
    Element.formUpdateReview.form.addEventListener('submit', async e=>{
        e.preventDefault();
        const button = e.target.getElementsByTagName('button')[0];
        const label = Util.disableButton(button);

         //checks if current user can update their reviews by their emails
         if(Auth.currentUser.email != e.target.email.value){
            Util.info('Error', 'Cannot update other user\'s replies', Element.modalUpdateReply);
            Util.enableButton(button, label)
            return;
        }

              //new reply object is created from modal form
              const r = new Review({
                content: e.target.content.value,
                email: e.target.email.value,
                productId: e.target.productId.value,
                timestamp: Date.now(),
                uid: e.target.uid.value,
            });
            r.docId = e.target.docId.value;
             //update new reply to firebase, calls firebase controller update reply function
            
             const errors = r.validate();
             Element.formUpdateReview.errorContent.innerHTML = errors.content ? errors.content : '';

             if(Object.keys(errors).length !=0){
                 Util.enableButton(button, label)
                 return;
             }

        //update new review to firebase, calls firebase controller update review function
        try{
            await FirebaseController.updateReview(r)
            //updates browser
            // const cardTag = document.getElementById('card-'+r.docId)
            // cardTag.getElementsByClassName('card-text')[0].innerHTML = `${r.content}`;
            Details.details_page(r.productId)
            
            Util.info('Updated Reply', 'Reply has been updated', Element.modalUpdateReview);
        }catch(e){
            if(Constant.DEV) console.log(e);
            Util.info('Update reply error', JSON.stringify(e), Element.modalUpdateReview)
        }

        Util.enableButton(button, label)

    })

}


export async function update_review(docId, userEmail){
        let review;
        if(Auth.currentUser.email == userEmail && !isAdmin(Auth.currentUser.email)){
        try{
            //calls firebase controller function from fbc.js with docId
            review = await FirebaseController.getReviewById(docId)
            //if review doesn't exist
            if(!review){
                Util.info('getReviewById error', 'No review found by id')
                return;
            }

        }catch(e){
            if(Constant.DEV) console.log(e)
            Util.info('getReviewById Error', JSON.stringify(e))
            return;
        }
    }else{
        Util.info('Error', 'Cannot update other User\'s Reviews')
         return;
    }

    //show review after update clicked
    Element.formUpdateReview.form.docId.value = review.docId
    Element.formUpdateReview.form.content.value = review.content
    Element.formUpdateReview.form.productId.value = review.productId
    Element.formUpdateReview.form.uid.value = review.uid
    Element.formUpdateReview.form.email.value = review.email
    Element.formUpdateReview.form.timestamp.value = review.timestamp

    Element.modalUpdateReview.show()

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