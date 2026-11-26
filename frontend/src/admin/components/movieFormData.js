export function createMovieFormData(form, isDraft) {
  const data = new FormData();
  const fields = ["title", "description", "genre", "rating", "releaseDate", "trailerLink",
    "language", "duration", "certificate", "status", "ottPlatform", "isInCinemas"];
  for (const field of fields) data.append(field, form[field]);
  if (isDraft !== undefined) data.append("isDraft", isDraft);
  for (const field of ["formats", "cities"]) data.append(field, JSON.stringify(form[field]));
  for (const field of ["poster", "banner"]) {
    if (form[field]) data.append(field, form[field]);
  }
  for (const [field, roleKey] of [["cast", "role"], ["crew", "position"]]) {
    let nextUploadIndex = 0;
    const people = form[field].map((person) => {
      if (person.image) data.append(field + "Images", person.image);
      return {
        _id: person._id,
        name: person.name,
        [roleKey]: person[roleKey],
        image: person.existingImage || null,
        uploadIndex: person.image ? nextUploadIndex++ : null,
      };
    });
    data.append(field, JSON.stringify(people));
  }
  return data;
}
