"""edge-tts를 한 번만 불러와 두고 서버의 요청을 계속 처리하는 작업 프로세스.
요청마다 파이썬을 새로 띄우면 느린 서버에서 10초 가까이 걸려서, 한 번 띄운 프로세스를 재사용한다.
입력(표준입력, 한 줄에 하나): {"id": 1, "text": "...", "voice": "...", "rate": "-10%", "out": "경로"}
출력(표준출력, 한 줄에 하나): {"id": 1, "ok": true, "bounds": [{"t": "단어", "o": 시작ms, "d": 길이ms, "k": "W"}]} 또는 {"id": 1, "ok": false, "error": "..."}"""
import asyncio
import json
import sys

import edge_tts


def reply(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


async def handle(job):
    try:
        try:
            comm = edge_tts.Communicate(job["text"], job["voice"], rate=job["rate"], boundary="WordBoundary")
        except TypeError:  # 오래된 edge-tts는 boundary 인자를 받지 않는다(기본값이 단어 경계)
            comm = edge_tts.Communicate(job["text"], job["voice"], rate=job["rate"])
        audio = bytearray()
        bounds = []
        async for ch in comm.stream():
            kind = ch.get("type")
            if kind == "audio":
                audio.extend(ch["data"])
            elif kind in ("WordBoundary", "SentenceBoundary"):
                # 시작(o)과 길이(d)를 밀리초로 바꿔 둔다. k: W=단어, S=문장
                bounds.append({"t": ch.get("text", ""), "o": round(ch["offset"] / 10000), "d": round(ch["duration"] / 10000), "k": kind[0]})
        if not audio:
            raise RuntimeError("빈 음성")
        with open(job["out"], "wb") as f:
            f.write(audio)
        reply({"id": job["id"], "ok": True, "bounds": bounds})
    except Exception as err:  # 한 요청이 실패해도 작업 프로세스는 계속 돌아간다
        reply({"id": job.get("id"), "ok": False, "error": str(err)[:200]})


async def main():
    reply({"ready": True})
    tasks = set()
    while True:
        line = await asyncio.to_thread(sys.stdin.readline)
        if not line:
            break
        try:
            job = json.loads(line)
        except ValueError:
            continue
        task = asyncio.create_task(handle(job))
        tasks.add(task)
        task.add_done_callback(tasks.discard)
    if tasks:
        await asyncio.gather(*tasks)


asyncio.run(main())
