import { ipcRenderer } from "electron";

const SAVE_BUTTON = 'button[data-js-trigger="submit"]';
const FORM = 'form.js-diary-entry-form';

document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(SAVE_BUTTON);
    if (!btn) return;

    const form = btn.form || document.querySelector<HTMLFormElement>(FORM);
    if (!form) return;

    const dataForm = new FormData(form);
    const getValue = (key: string) => (dataForm.get(key) as string | null) || "";

    const payload = {
        rating: Number(getValue('rating')) / 2,
        review: getValue('review'),
        liked: dataForm.has('liked'),
        rewatch: dataForm.has('rewatch'),
        containsSpoilers: dataForm.has('containsSpoilers'),
        addToDiary: dataForm.has('specifiedDate'),
        watchedDate: getValue('viewingDateStr'),
        tags: getValue('tags'),
    }

    ipcSend("letterboxdReviewSubmitted", payload);
});

function ipcSend<Key extends keyof EventPayloadMapping>(
    key: Key,
    payload: EventPayloadMapping[Key],
) {
    ipcRenderer.send(key, payload);
}
