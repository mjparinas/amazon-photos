const axios = require("axios");
const fs = require("fs");

const api = axios.create({
  baseURL: `https://www.amazon.ca/drive/v1`
});

const headers = {
  headers: {
    "x-amzn-SessionId": "143-4807285-1353237",
    "Cookie": "session-id=143-4807285-1353237; ubid-acbca=133-0995566-8980709; x-acbca=I1mz6NYHAc4eCBmPAGKn9MgegD1x5@Fs; at-acbca=Atza|IwEBIAJ3M4CIIQNMjcWCStkpSkSHLBR8_w9OzMZVp3zIvtVyPzB7UKObOizmFGKxpu_iOeN6DzuMts_o1Ud9lUwFAputFLTUOfdcx8SySzlSsDXk_xY3W79Q5WpGsdc8v80K2lfBvMwkkVlmz_PAChxu60MgBYKdgSIqAjXcGVum83tsLcoqyI9EbJR6hLteN92k6ezcNki9tz2hFfun_Ch_SEWH;",
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
