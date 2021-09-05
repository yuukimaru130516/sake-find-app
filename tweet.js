'use strict';

const Twitter = require('twitter-lite');
const cron = require('cron').CronJob;

let checkedTweets = [];

const twitter = new Twitter({
  consumer_key: 'PG5uQt3FUgfVTSotCTBijTYpM',
  consumer_secret: 'SLW7M5jMSSHtSVgG9OypMNC0hiLb7TgACK5E4SRiXKGiWCZuwa',
  access_token_key: '1424287143661240330-2gm3G2hVmMi4RatXUFGRUALhol31HN',
  access_token_secret: 'M5g8M5duJKsnC5CqaZ809tbTZjK6GzP1wvv1Dd4uNSxKn'
});

function getHomeTimeLine() {
  twitter.get('statuses/home_timeline')
    .then((tweets) => {
      // 初回起動時は取得するだけで終了
      if (checkedTweets.length === 0) {
        tweets.forEach(function(homeTimeLineTweet, key) {
          checkedTweets.push(homeTimeLineTweet); // 配列に追加
        });

        return;
      }

      const newTweets = [];
      tweets.forEach(function(homeTimeLineTweet, key) {
        if (!isCheckedTweet(homeTimeLineTweet)) {
          responseHomeTimeLine(homeTimeLineTweet);
          newTweets.push(homeTimeLineTweet); // 新しいツイートを追加
        }
      });

      // 調査済みリストに追加と、千個を超えていたら削除
      checkedTweets = newTweets.concat(checkedTweets); // 配列の連結
      // 古い要素を消して要素数を1000個にする。
      if (checkedTweets.length > 1000) checkedTweets.length = 1000;
    })
    .catch((err) => {
      console.error(err);
    });
}

function isCheckedTweet(homeTimeLineTweet) {
  // ボット自身のツイートは無視する。
  if (homeTimeLineTweet.user.screen_name === '${bot_RR1}') {
    return true;
  }

  for (let checkedTweet of checkedTweets) {
    // 同内容を連続投稿をするアカウントがあるため、一度でも返信した内容は返信しない仕様にしています。
    if (checkedTweet.text === homeTimeLineTweet.text) {
      return true;
    }
  }

  return false;
}

const responses = ['面白い！', 'すごい！', 'なるほど！'];

function responseHomeTimeLine(homeTimeLineTweet) {
  const tweetMessage = '@' + homeTimeLineTweet.user.screen_name + '「' + homeTimeLineTweet.text + '」 ' + responses[Math.floor(Math.random() * responses.length)];
  twitter.post('statuses/update', {
    status: tweetMessage,
    in_reply_to_status_id: homeTimeLineTweet.id_str
  }).then((tweet) => {
    console.log(tweet);
  }).catch((err) => {
    console.error(err);
  });
}

const cronJob = new cron({
  cronTime: '00 0-59/2 * * * *',
  start: true,
  onTick: function() {
    // getHomeTimeLine();
  }
});

const stream = twitter.stream('statuses/filter', { track: '@${bot_RR1}' })
  .on('data', (tweet) => {
    console.log(tweet.text);

    const tweetMessage = '@' + tweet.user.screen_name + ' 呼んだ？　(*´ω｀*)';
    twitter.post('statuses/update', {
      status: tweetMessage,
      in_reply_to_status_id: tweet.id_str
    })
    .then((tweet) => {
      console.log(tweet);
    })
    .catch((err) => {
      console.err(err);
    });
  })
  .on('error', (err) => {
    console.err(err);
  });