function importSFX(filePath) {
    app.beginUndoGroup("SFX Import");
    try {
        var file = new File(filePath);
        if (!file.exists) return;

        var sfxFolder = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) instanceof FolderItem && app.project.item(i).name === "SFX") {
                sfxFolder = app.project.item(i);
                break;
            }
        }
        if (sfxFolder === null) sfxFolder = app.project.items.addFolder("SFX");

        var importOptions = new ImportOptions(file);
        var item = app.project.importFile(importOptions);
        item.parentFolder = sfxFolder;

        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {
            var layer = comp.layers.add(item);
            layer.startTime = comp.time;
        }
    } catch (e) { alert(e); }
    app.endUndoGroup();
}