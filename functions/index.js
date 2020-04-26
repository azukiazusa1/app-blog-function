const functions = require('firebase-functions')
const admin = require('firebase-admin')
const moment = require('moment')
admin.initializeApp()

const firestore = admin.firestore()
const tagasRef = firestore.collection('tags')
const archivesRef = firestore.collection('archives')

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

      const createdMonth = moment(data.created.seconds * 1000).format('YYYY-MM')
      
      archivesRef.doc(createdMonth)
        .get()
        .then(querySnapshot => {
          if (querySnapshot.exists) {
            archivesRef.doc(createdMonth)
              .update({
                articleCount: ++querySnapshot.data().articleCount
              }, { merge: true })
          } else {
            archivesRef.doc(createdMonth)
              .set({
                articleCount: 1
              })
          }
        })
      // 公開から下書きに変更されたとき
    } else if (previousData.published && !data.published) {
      deleteEvent(data)
    } else {
      return
    }
  })

exports.deleteArticls = functions.firestore
  .document('articles/{articleId}')
  .onDelete(snap => {
    const data = snap.data()
    if (!data.published) return
    deleteEvent(data)
  })

function deleteEvent(data) {
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
  const createdMonth = moment(data.created.seconds * 1000).format('YYYY-MM')
  archivesRef.doc(createdMonth)
    .get()
    .then(querySnapshot => {
      if (querySnapshot.exists) {
        if (querySnapshot.data().articleCount > 1) {
          archivesRef.doc(createdMonth)
            .update({
              articleCount: --querySnapshot.data().articleCount
            }, { merge: true })
        } else {
          archivesRef.doc(createdMonth).delete()
        }
      }
    })
}