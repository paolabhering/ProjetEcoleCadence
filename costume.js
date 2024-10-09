class groupeCostume {
    constructor(titre, category, color, age_group, notes, localisation, boite, image) {
        this.titre = titre;
        this.category = category;
        this.color = color;
        this.age_group = age_group;
        this.notes = notes;
        this.localisation = localisation;
        this.boite = boite;
        this.image = image;
    }
}

module.exports = { groupeCostume };