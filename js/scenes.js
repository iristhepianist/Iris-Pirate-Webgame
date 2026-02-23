const Scenes = {
    ...(window.tutorialScenes || {}),
    ...(window.deckScenes || {}),
    ...(window.shipyardScenes || {}),
    ...(window.inventoryScenes || {}),
    ...(window.eventScenes || {}),
    ...(window.dungeonScenes || {})
};

async function setScene(id) {
    currentScene = id;
    const s = Scenes[id];
    if (!s) {
        console.error('Scene not found:', id);
        return;
    }
    if (s.enter) s.enter();
    if (s.text) await printLog(typeof s.text === 'function' ? s.text() : s.text, 'normal');
    if (s.choices) {
        renderChoices(typeof s.choices === 'function' ? s.choices() : s.choices);
    } else {
        renderChoices([]);
    }
    updateUI();
}
