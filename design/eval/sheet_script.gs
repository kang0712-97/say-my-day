// Say My Day 사용자 평가 — 응답을 구글 시트에 한 줄씩 쌓는 Apps Script (T48a)
// 앱이 text/plain 으로 JSON을 보내면(사전 확인 요청이 없도록) 한 줄로 저장한다.
// 일기 내용은 받지 않는다. 열 구성은 design/tasks/T48_user_eval.md 와 같다.

var SHEET = '응답';
var HEAD = ['응답번호', '시각', 'test', 'Q1 편했나', 'Q2 막힌 곳', 'Q3 문제', 'Q4 다시 쓸 의향', 'Q5 빈도',
  'Q6 한 줄 의견', 'Q7 배우려는 언어', '듣기', '읽기', '말하기', '쓴 언어조합', '기기', '화면폭',
  '번역실패수', '음성실패수', 't1(초)', 't2(초)', 't3(초)', 't4(초)', '배움 쉬움', '배움 할 만함'];

function clean(v, max) {
  if (Array.isArray(v)) v = v.join(', ');
  v = (v === undefined || v === null) ? '' : String(v);
  v = v.slice(0, max || 100);
  // 수식으로 해석되지 않게
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function doPost(e) {
  var out = function (o) {
    return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  };
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!e || !e.postData || e.postData.contents.length > 5000) return out({ ok: false, error: 'bad request' });
    var d = JSON.parse(e.postData.contents);
    var id = clean(d.id, 40);
    if (!id) return out({ ok: false, error: 'no id' });

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
    if (sh.getLastRow() === 0) sh.appendRow(HEAD);
    else if (sh.getLastColumn() < HEAD.length) sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]); // 새 열 머리글을 자동으로 채움

    // 같은 응답번호는 한 번만 저장(제출 재시도 대비)
    var last = sh.getLastRow();
    if (last > 1) {
      var ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return out({ ok: true, dup: true });
    }

    var t = d.t || [];
    sh.appendRow([
      id, new Date(), d.test ? 'test' : '',
      clean(d.q1, 5), clean(d.q2, 200), clean(d.q3, 200), clean(d.q4, 5), clean(d.q5, 20),
      clean(d.q6, 300), clean(d.q7, 20), clean(d.listen, 5), clean(d.read, 5), clean(d.speak, 5),
      clean(d.pair, 20), clean(d.device, 20), clean(d.width, 6),
      clean(d.tfail, 5), clean(d.vfail, 5), clean(t[0], 8), clean(t[1], 8), clean(t[2], 8), clean(t[3], 8),
      clean(d.ease, 5), clean(d.doable, 5)
    ]);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: 'server' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() {
  return ContentService.createTextOutput('ok');
}
