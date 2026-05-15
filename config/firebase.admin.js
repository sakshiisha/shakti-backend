import admin from 'firebase-admin'

const hasFirebaseConfig =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL

if (hasFirebaseConfig && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type:          'service_account',
        project_id:    process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email:  process.env.FIREBASE_CLIENT_EMAIL,
        client_id:     process.env.FIREBASE_CLIENT_ID,
        auth_uri:      'https://accounts.google.com/o/oauth2/auth',
        token_uri:     'https://oauth2.googleapis.com/token',
      }),
    })
    console.log('[Firebase] Admin initialized ✅')
  } catch (err) {
    console.error('[Firebase] Init failed:', err.message)
  }
} else {
  console.log('[Firebase] Skipped — env vars not set')
}

export const sendPush = async ({ token, title, body, data = {} }) => {
  if (!token || !hasFirebaseConfig || !admin.apps.length) return null
  try {
    return await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high', notification: { sound: 'default' } },
      apns:    { payload: { aps: { sound: 'default', badge: 1 } } },
    })
  } catch (err) {
    console.error('Push failed:', err.message)
    return null
  }
}

export const sendPushToMany = async ({ tokens, title, body, data = {} }) => {
  if (!tokens?.length || !hasFirebaseConfig || !admin.apps.length) return null
  try {
    return await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
    })
  } catch (err) {
    console.error('Multicast push failed:', err.message)
    return null
  }
}

export default admin