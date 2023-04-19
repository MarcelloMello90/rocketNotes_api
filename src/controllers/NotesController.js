const knex = require("../database/knex");

class NotesController{
  async create(request, response){
    const { title, description, tags, rating } = request.body;
    const { user_id } = request.params;

    const [note_id] = await knex("movieNotes").insert({
      title,
      description,
      rating,
      user_id
    });

    const movieTagsInsert = tags.map(name => {
      return{
        name,
        user_id,
        note_id
      }
   
    });
    await knex("movieTags").insert(movieTagsInsert);
    // await knex.insert(movieTagsInsert).into("movieTags")

    return response.json();
  }

  async show(request, response) {
    const { id } = request.params;

    const note = await knex("movieNotes").where({ id }).first();
    const tags = await knex("movieTags").where({ note_id: id }).orderBy("name");

    //await knex("tags").insert({ movieTags })

    return response.json({
      ...note,
      tags
    });
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("movieNotes").where({ id }).delete();

    return response.json();
  }

  //metodo utilizado para listar as notas
  async index(request, response){
    const { title, user_id, tags } = request.query;

    let notes;

    if(tags){
      const filterTags = tags.split(',').map(tag => tag.trim());
      // console.log(filterTags)

      notes = await knex("movieTags")
        .select([
          "movieNotes.id",
          "movieNotes.title",
          "movieNotes.user_id",
        ])
        .where("movieNotes.user_id", user_id)
        .whereLike("movieNotes.title", `%${title}%`)
        .whereIn("name", filterTags)
        .innerJoin("movieNotes", "movieNotes.id", "movieTags.note_id")
        .orderBy("movieNotes.title")

    } else {
      notes = await knex("movieNotes")
        .where({ user_id })
        .whereLike("title", `%${title}%`)
        .orderBy("title");
    }

    const userTags = await knex("movieTags").where({ user_id });
    //o "notes" que esta aplicado o "map" é a const criada dentro de async index e nao a tabela.
    const notesWithTags = notes.map(note => {
      const noteTags = userTags.filter(tag => tag.note_id === note.id);

      return {
        ...note,
        movieTags: noteTags
      }
    })

    return response.json(notesWithTags);
  }
  
  // split transforma o texto em array, utilizando como delimitador a virgula

  //whereLike, ele procura valores dentro de uma palavra, frase. Informamos qual o campo que iremos fazer a consulta, neste caso o "title". Iremos inserir um percentual "%", antes e depois do "title", pois ele vai considerar a pesquisa, tanto antes como depois da palavra procurada.
}

module.exports = NotesController;

