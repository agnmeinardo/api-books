# api-books

Se trata de un proyecto de desarrollo backend en NodeJS, utilizando API Rest y base de datos MySQL para conocer si los libros del usuario se encuentran en su biblioteca o prestados. En caso de estar prestado, a quien se los presto.


Se requiere conocer:
    - De la persona a prestar los libros el nombre, apellido, email y alias. El email debe ser unico. Todos los datos son requeridos.

    - De los generos de los libros, solo los nombres, el campo nunca puede ser vacio o nulo y no pueden repetirse las categorias.

    - De los libros, el nombre, una descripcion, su categoria y la persona a la cual se le ha prestado el libro. Para representar que un libro se encuentra en la biblioteca se puede utilizar cualquiera de las siguientes estrategias: null para libros en la biblioteca en el campo de persona_id, que el usuario se encuentre ingresado como una persona mas.