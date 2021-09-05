#! /usr/bin/env node 
'use strict';
const axios = require('axios');
const http = require('http');
const pug = require('pug');


const server = http.createServer((req, res) => {
  switch(req.method) {
    case 'GET':
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end(pug.renderFile('./views/top.pug'));
      break;
    
    case 'POST':
       let body = [];
        req.on('data', chunk => {
          body.push(chunk);
        }).on('end', () => {
          body = Buffer.concat(body).toString();
          const params = new URLSearchParams(body);
          const findContent = params.get('content');
          // const content = findFlavor(findContent);
          findFlavor(findContent, req, res);
        
      });
      break;
  }
})
.on('error', err => {
  console.error(`Server Error: ${err}`);

})
.on('clientError', err => {
  console.error(`Client Error ${err}`);
}) 

// end point
const url = "https://muro.sakenowa.com/sakenowa-data/api"

// コンソールで入力した銘柄が存在するか検索(同期処理)
function readBrandInput(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(question, (ans) => {
      resolve(ans);
      readline.close();
    });
  });
}

function findBrand(findContent) {
  //const brand = await readBrandInput('検索したい銘柄名を入力してください: ');
  return new Promise((resolve) => {
    axios.get(url + '/brands').then(res => {
      const found = res.data.brands.filter(element => element.name === findContent)
      found.length ? resolve(found[0]):
      resolve(null); 
    });
  });
}

async function findFlavor(findContent, req, res) {
  const find = await findBrand(findContent);
  if ( find === null ) {
    const content = {};
    content.name = "銘柄が登録されていません";
    res.end(pug.renderFile('./views/find.pug', {content}));
    return false; 
  }
  axios.get(url + '/flavor-charts').then((response) => {
    const result = response.data.flavorCharts.filter(element => element.brandId === find.id);
    const content = getTagName(find, result);
    res.end(pug.renderFile('./views/find.pug', {content}));

  })
}

// タグに名前を付与する関数
function getTagName(find, result) {
  const tagName =  Object.keys(result[0]).map(value => {
      return value.replace('f1', '華やか').replace('f2', '芳醇').replace('f3', '重厚')
      .replace('f4', '穏やか').replace('f5', 'ドライ').replace('f6', '軽快');
  });
  const tagScore = Object.values(result[0]).map(value => Math.round(value * 100));
  const res = {};
  res['name'] = find.name;
  for(let i = 0; i < tagName.length; i++){
    res[tagName[i]] = tagScore[i];
  }
  return res;
}

const port = 8000;
server.listen(port, () => {
  console.info(`Listening on ${port}`);
})