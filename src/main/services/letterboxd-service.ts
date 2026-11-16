import { BrowserWindow, session } from "electron";

const SIGN_IN_URL = "https://letterboxd.com/sign-in/";
const SITE = "https://letterboxd.com";
const AUTH_COOKIE = "letterboxd.user";
const USERNAME_COOKIE = "letterboxd.signed.in.as";
const AUTH_COOKIES = [AUTH_COOKIE, 'letterboxd.user.CURRENT', USERNAME_COOKIE];

export const PARTITION = "persist:letterboxd";

const ses = () => session.fromPartition(PARTITION);

async function getLetterboxdUsername(): Promise<string | null> {
    const [cookie] = await ses().cookies.get({ url: SITE, name: USERNAME_COOKIE });
    return cookie?.value || null;
}

export async function isLoggedInToLetterboxd(): Promise<string | null> {
    const cookies = await ses().cookies.get({ url: SITE, name: AUTH_COOKIE });
    return cookies.length > 0 ? await getLetterboxdUsername() : null;
}

export async function loginToLetterboxd(parent: BrowserWindow): Promise<string | null> {
    if (await isLoggedInToLetterboxd()) return await getLetterboxdUsername();

    return new Promise((resolve) => {
        const win = new BrowserWindow({
            width: 800,
            height: 600,
            parent,
            webPreferences: {
                partition: PARTITION,
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true
            }
        });

        const cookies = ses().cookies;
        let finished = false;

        const onCookieChanged = (_event: Electron.Event, cookie: Electron.Cookie, _cause: string, removed: boolean) => {
            if (!removed && cookie.name === AUTH_COOKIE) checkLogin(true);
        }

        const checkLogin = async (ok: boolean) => {
            if (finished) return;
            finished = true;
            cookies.removeListener("changed", onCookieChanged);
            const username = ok ? await getLetterboxdUsername() : null;
            resolve(username);
            if (!win.isDestroyed()) win.close();
        }

        cookies.on("changed", onCookieChanged);

        win.on("closed", () => {
            checkLogin(false);
        });

        win.loadURL(SIGN_IN_URL).catch(() => { })
    })
}
export async function logoutFromLetterboxd(): Promise<void> {
    await Promise.all(AUTH_COOKIES.map(cookieName => ses().cookies.remove(SITE, cookieName)));
}


