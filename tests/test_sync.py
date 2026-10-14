import os, subprocess, sys, time
import requests
BASE='http://127.0.0.1:4175'; DB='/tmp/bsch-sync-test.sqlite3'
try: os.remove(DB)
except FileNotFoundError: pass
proc=subprocess.Popen([sys.executable,'app.py'],env={**os.environ,'BSCH_DB_PATH':DB,'BSCH_HOST':'127.0.0.1','BSCH_PORT':'4175','BSCH_SYNC_TOKEN':'TEST-SYNC'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
    time.sleep(1.5); h={'X-BSCH-Sync-Token':'TEST-SYNC'}
    pull=requests.get(BASE+'/api/sync/pull',headers=h); assert pull.status_code==200, pull.text
    data=pull.json(); assert data['clinics']; c=data['clinics'][0]
    booking={'booking_no':'M-SYNC-1','patient_name':'اختبار مزامنة','phone':'01000000000','clinic_name':c['name'],'visit_date':'2099-01-01','appointment_time':'08:30','service_type':c['services'][0]['name'],'status':'Confirmed','created_at':'2098-01-01T00:00:00','updated_at':'2098-01-01T00:00:00'}
    pushed=requests.post(BASE+'/api/sync/push',headers={**h,'Content-Type':'application/json'},json={'bookings':[booking]}); assert pushed.status_code==200, pushed.text; assert 'M-SYNC-1' in pushed.json()['accepted']
    print('SYNC_API_TEST=PASS')
finally:
    proc.terminate(); proc.wait(timeout=5)
