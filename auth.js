// ============================================================
// CONTROLAR ACADEMY — LOGIN COM GOOGLE (Firebase Authentication)
// A configuração do projeto fica em firebase-config.js.
// ============================================================
const VERSAO = "13.4.0";

async function iniciarLogin() {
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg) return;
  try {
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${VERSAO}/firebase-app.js`);
    const {
      getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
      getRedirectResult, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence
    } = await import(`https://www.gstatic.com/firebasejs/${VERSAO}/firebase-auth.js`);

    const app = initializeApp(cfg);
    const auth = getAuth(app);
    auth.languageCode = "pt-BR";
    await setPersistence(auth, browserLocalPersistence);
    const provedor = new GoogleAuthProvider();
    provedor.setCustomParameters({ prompt: "select_account" });

    window.caLoginGoogle = async () => {
      try {
        await signInWithPopup(auth, provedor);
      } catch (e) {
        if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
          await signInWithRedirect(auth, provedor);
        } else if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") {
          window.caErroLogin("Login cancelado.");
        } else if (e.code === "auth/unauthorized-domain") {
          window.caErroLogin("Este endereço ainda não está autorizado no Firebase.");
        } else {
          console.error(e);
          window.caErroLogin("Não foi possível entrar agora. Tente de novo.");
        }
      }
    };
    window.caLogout = () => signOut(auth);

    getRedirectResult(auth).catch(e => console.error(e));
    onAuthStateChanged(auth, usuario => window.caAoMudarLogin(usuario));
  } catch (e) {
    console.error("Falha ao carregar o login", e);
    window.caErroLogin("Sem conexão com o serviço de login. Use o modo teste.");
    window.caAoMudarLogin(null);
  }
}
iniciarLogin();
