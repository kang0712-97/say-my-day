"""edge-tts를 한 번만 불러와 두고 서버의 요청을 계속 처리하는 작업 프로세스.
요청마다 파이썬을 새로 띄우면 느린 서버에서 10초 가까이 걸려서, 한 번 띄운 프로세스를 재사용한다.
입력(표준입력, 한 줄에 하나): {"id": 1, "text": "...", "voice": "...", "rate": "-10%", "out": "경로"}
출력(표준출력, 한 줄에 하나): {"id": 1, "ok": true} 또는 {"id": 1, "ok": false, "error": "..."}"""
import asyncio
import json
import sys

import edge_tts


def reply(obj):
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


async def handle(job):
    try:
        await edge_tts.Communicate(job["text"], job["voice"], rate=job["rate"]).save(job["out"])
        reply({"id": job["id"], "ok": True})
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
