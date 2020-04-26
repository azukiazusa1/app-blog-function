const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const firestore = admin.firestore()
const tagasRef = firestore.collection('tags')

exports.updateArticle = functions.firestore
  .document('articles/{articleId}')
  .onUpdate(change => {
    const data = change.after.data()
    const previousData = change.before.data()

    // 下書きから公開されたとき
    if (!previousData.published && data.published) {
      data.tags.forEach(tag => {
        tagasRef.doc(tag)
          .get()
          .then(querySnapshot => {
            tagasRef.doc(tag)
              .update({ 
                articleCount: ++querySnapshot.data().articleCount
              }, { merge: true })
          })
      })
      // 公開から下書きに変更されたとき
    } else if (!previousData.published && data.published) {
      data.tags.forEach(tag => {
        tagasRef.doc(tag)
          .get()
          .then(querySnapshot => {
            tagasRef.doc(tag)
              .update({ 
                articleCount: --querySnapshot.data().articleCount
              }, { merge: true })
          })
      })
    } else {
      return
    }
  })

exports.deleteArticls = functions.firestore
  .document('articles/{articleId}')
  .onDelete(snap => {
    const data = snap.data()
    if (!data.published) return
    data.tags.forEach(tag => {
      tagasRef.doc(tag)
        .get()
        .then(querySnapshot => {
          tagasRef.doc(tag)
            .update({ 
              articleCount: --querySnapshot.data().articleCount
            }, { merge: true })
        })
    })
  })