const fs = require("fs");
const arp = require("arp-a");
("use strict");
const cron = require("node-cron");

function exportCSV(fname, content) {
  var formatCSV = "";
  for (var i = 0; i < content.length; i++) {
    var value = content[i];

    for (var j = 0; j < value.length; j++) {
      var innerValue = value[j] === null ? "" : value[j].toString();
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) formatCSV += ",";
      formatCSV += result;
    }
    formatCSV += "\n";
  }
  fs.writeFile(fname, formatCSV, "utf8", function (err) {
    if (err) {
      //console.log("fail to save");
    } else {
      //console.log("saved");
    }
  });
}

///////////////////////////////

function save(fname, names, enter, exit, time) {
  //save
  var data = [];
  data.push(["name", "enter", "exit"]);
  for (let name of names) {
    data.push([name, enter[name], exit[name]]);
  }
  if (data.length > 1) {
    exportCSV(fname, data);
  }
  console.log(time, names.size);
}

var names = new Set();
var enter = {};
var exit = {};
function update(callback) {
  //mac,ip読み込み
  const membersData = JSON.parse(
    fs.readFileSync("membersData.json").toString()
  );

  //日付更新確認
  const date = new Date();
  if (
    date.getHours() == 0 &&
    date.getMinutes() == 0 &&
    date.getSeconds() == 0
  ) {
    names = new Set();
    enter = {};
    exit = {};
    console.log("new day. clear data");
  }
  const time = date.getHours().toString() + ":" + date.getMinutes().toString();
  const fname =
    date.getFullYear().toString() +
    "_" +
    (date.getMonth() + 1).toString() +
    "_" +
    date.getDate().toString() +
    ".csv";

  //arp -a 実行, jsonと照合
  arp.table(function (err, entry) {
    if (!!err) return console.log("arp: " + err.message);
    if (!entry) return;

    Object.keys(membersData.members).forEach((key) => {
      const member = membersData.members[key];
      if (member.mac == entry.mac) {
        names.add(member.name);
        if (!(member.name in enter)) enter[member.name] = time;
        exit[member.name] = time;
        //console.log(member.name, time, names.size);
      }
    });
  });

  //csvに保存．同期のため，setTimeout使用
  setTimeout(() => {
    save(fname, names, enter, exit, time);
  }, 1);
}

//定期実行
cron.schedule("0 * * * * *", () => {
  update();
});
