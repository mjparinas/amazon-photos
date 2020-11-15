const axios = require("axios");
const fs = require("fs");

const api = axios.create({
  baseURL: `https://www.amazon.ca/drive/v1`
});

const headers = {
  headers: {
    "x-amzn-SessionId": "141-1113169-3539107",
    "Cookie": "session-id=141-1113169-3539107; ubid-acbca=135-1070176-3102258; x-acbca=RojC?@qseYM@W5in6uUy@9xJUOJcriHj; at-acbca=Atza|IwEBIHTQYrK4NscwHLzzZYY56IeISswNv2sjWwan1e0BD6YFnQcr_VyGa0i4NM2wwxOJeStxHVEaSaZb4Qv-Esonhk2LiJF1tb9IuIHcTwJshYmlgnGQaz4W-4akdHvCTIlDt6FJLs0YGWmfUicqLhg5I9zuengheV8-bL_6d_YuiJXD9c0KSEnZOEoc04HQUQrj601M_2GrC6fbzkQf0Bkd9OLJ",
  }
};

async function getPhotos() {
  const total = 29931;
  const limit = 200;
  let result = [];

  for (let i = 0; i < Math.ceil(total / limit); i++) {
    console.log(`Loading ${i} of ${Math.ceil(total / limit)}`);
    await api.get(`search?asset=ALL&filters=type%3A(PHOTOS+OR+VIDEOS)&limit=${limit}&lowResThumbnail=true&searchContext=customer&sort=%5B%27contentProperties.contentDate+DESC%27%5D&tempLink=false&offset=${i * limit}&resourceVersion=V2&ContentType=JSON&_=1604364256583`,
    headers).then(response => {
      for (let j = 0; j < response.data.data.length; j++) {
        const { id, name, ownerId } = response.data.data[j];

        result.push({
          id, name, ownerId
        })
      }
    });
  }

  return result;
};

async function downloadPhotos(photos) {
  const BATCH_SIZE = 10;

  for (let i = 0; i < Math.ceil(photos.length / BATCH_SIZE); i++) {
    let batch = [];

    for (let j = 0; j < BATCH_SIZE; j++) {
      const { id, name, ownerId } = photos[i * BATCH_SIZE + j];  

      if (fs.existsSync(`./images/${name}`)) {
        console.log(`Skipping image ${name}: ${i * BATCH_SIZE + j} of ${photos.length}`);
      } else {
        batch.push(
          api.get(`nodes/${id}/contentRedirection?querySuffix=%3Fdownload%3Dtrue&ownerId=${ownerId}`, {responseType: 'arraybuffer', ...headers }).then(image => {
            console.log(`Saving image ${name}: ${i * BATCH_SIZE + j} of ${photos.length}`);
            fs.writeFileSync(`./images/${name}`, image.data);
          }).catch(error => {
            if (error.response) {
              console.log(`Error: ${error.response.status}`);
              console.log(error.response.data);
            }
          })
        );
      }
    }

    console.log(`Batch ${i} of ${Math.ceil(photos.length / BATCH_SIZE)}`);
    await Promise.all(batch);
  }
};

async function main() {
  const photos = await getPhotos();
  await downloadPhotos(photos);
  console.log("Complete.");
}

main();
