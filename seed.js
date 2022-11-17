const Project = require('./models/project.js');
const faker = require('faker');
const category = ["Science", "Biology", "Physics", "Chemistry", "Novel", "Travel", "Cooking", "Philosophy", "Mathematics", "Ethics", "Technology"];

const author = [];
for(let i = 0; i < 11; i++) {
    author.push(faker.name.findName());
}
async function seed(limit) {
    for(let i = 0; i < 11; i++) {
        author.push(faker.name.findName());
    }
    for(let i = 0; i < limit; i++) {
        let index1 = Math.floor(Math.random() * Math.floor(11));
        let index2 = Math.floor(Math.random() * Math.floor(11));
        try {
            const project = new Project({
                title: faker.lorem.words(),
                ISBN: faker.random.uuid(),
                stock: 10,
                author: author[index2],
                description: faker.lorem.paragraphs(3),
                category: category[index1],
            });
            await project.save();
        } catch(err) {
            console.log("Error at creating projects");
        }
    }
}

module.exports = seed;