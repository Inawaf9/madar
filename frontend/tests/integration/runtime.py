"""Live Spring Boot contract checks against disposable local records.
Run: python3 tests/integration/runtime.py
Requires the local backend and XAMPP MySQL client. Bootstraps ONLY the generated
registration's ID using a SELECT, because registration omits its ID. It never
uses an account listing or modifies backend source. Test credentials are fake.
"""
import json, os, re, subprocess, time, urllib.request, urllib.error
from pathlib import Path

base = os.environ.get('MADAR_TEST_BASE_URL', 'http://127.0.0.1:3000/api/backend')
backend = os.environ.get('MADAR_TEST_BACKEND_URL', 'http://localhost:8080')
records = []
def request(method, path, body=None, expected=200, direct=False, check=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request((backend if direct else base) + '/api/v1/' + path, data=data, method=method, headers={'Content-Type':'application/json'})
    try:
        response = urllib.request.urlopen(req, timeout=20); status=response.status; raw=response.read().decode()
    except urllib.error.HTTPError as e:
        status=e.code; raw=e.read().decode()
    try: value=json.loads(raw)
    except ValueError: value=raw
    assert status == expected, (method, path, status, value)
    if check: assert check(value), (method,path,value)
    records.append({'method':method,'path':'/api/v1/'+path,'status':status,'assertions':'status and contract/business response','target':'backend' if direct else 'frontend proxy'})
    return value

def database_id(email):
    propfile=Path(os.environ.get('MADAR_TEST_BACKEND_PROPERTIES','../Backend/src/main/resources/application.properties'))
    props={}
    for line in propfile.read_text().splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key,value=line.split('=',1);props[key.strip()]=value.strip()
    match=re.fullmatch(r'jdbc:mysql://([^:/]+)(?::(\d+))?/([^?]+)(?:\?.*)?',props['spring.datasource.url'])
    assert match, 'Local MySQL configuration required'
    host,port,db=match.groups(); assert host in ('localhost','127.0.0.1'), 'Local test database only'
    password=props.get('spring.datasource.password','')
    assert not password.startswith('${'), 'Set explicit local test DB config'
    env=dict(os.environ,MYSQL_PWD=password)
    # email is generated below from digits and a fixed .test domain.
    sql="SELECT id FROM user WHERE email='"+email+"'"
    result=subprocess.run(['/Applications/XAMPP/xamppfiles/bin/mysql','--protocol=TCP','-h',host,'-P',port or '3306','-u',props.get('spring.datasource.username','root'),'-D',db,'-N','-B','-e',sql],env=env,capture_output=True,text=True,check=True)
    return int(result.stdout.strip())

stamp=str(time.time_ns());email='madar.e2e.'+stamp+'@example.test'
account={'fullName':'Madar Integration Test','email':email,'password':'TestOnly!Pass8','role':'USER'}
user=None
try:
    request('POST','user/register',account,check=lambda v: v.get('message')=='User registered successfully' and 'id' not in v)
    user=database_id(email)
    request('GET',f'user/get/{user}',check=lambda v:v['email']==email and v['id']==user and 'password' not in v)
    request('POST','user/register',account,expected=400,check=lambda v:'already' in v['message'])
    request('POST','user/register',{**account,'email':'bad','password':'x'},expected=400)
    request('PUT',f'user/update/{user}',{**account,'fullName':'Madar Updated Test'})
    request('GET',f'user/get/{user}',check=lambda v:v['fullName']=='Madar Updated Test')
    # Global reads are not consumer features: check shape without printing data.
    for feature in ['current-home','housing-preference','property-comparison']:
        request('GET',feature+'/get',direct=True,check=lambda v:isinstance(v,list))
    for method,path,body in [('GET',f'user/admin/get-all/{user}',None),('PUT',f'user/admin/update/{user}/{user}',account),('DELETE',f'user/admin/delete/{user}/{user}',None)]:
        request(method,path,body,expected=400,direct=True,check=lambda v:v['message']=='Only admin can perform this action')
    home={'latitude':24.7136,'longitude':46.6753,'movedInAt':'2026-01-01'}
    request('GET',f'current-home/get-by-user/{user}',expected=400)
    request('POST',f'current-home/add/{user}',home,expected=201)
    hid=request('GET',f'current-home/get-by-user/{user}',check=lambda v:v['latitude']==home['latitude'])['id']
    request('PUT',f'current-home/update/{user}/{hid}',{**home,'latitude':24.72})
    request('GET',f'current-home/get-by-user/{user}',check=lambda v:v['latitude']==24.72)
    request('DELETE',f'current-home/delete/{user}/{hid}')
    pref={'region':'Riyadh','city':'Riyadh','district':'Test district','maxBudget':500000,'propertyType':'apartment','listingType':'sale'}
    request('GET',f'housing-preference/get-by-user/{user}',expected=400)
    request('POST',f'housing-preference/add/{user}',pref,expected=201)
    pid=request('GET',f'housing-preference/get-by-user/{user}')['id']
    request('PUT',f'housing-preference/update/{user}/{pid}',{**pref,'maxBudget':600000})
    request('GET',f'housing-preference/get-by-user/{user}',check=lambda v:v['maxBudget']==600000)
    request('DELETE',f'housing-preference/delete/{user}/{pid}')
    place={'name':'Test office','type':'work','latitude':24.71,'longitude':46.67,'importance':3,'visitPerWeek':5}
    request('GET',f'place-preference/get/{user}',expected=400,check=lambda v:v['message']=='No places found for this user')
    request('POST',f'place-preference/add/{user}',place)
    lid=request('GET',f'place-preference/get/{user}')[0]['id']
    request('PUT',f'place-preference/update/{user}/{lid}',{**place,'name':'Updated test office'})
    request('PATCH',f'place-preference/importance/{user}/{lid}/5')
    request('PATCH',f'place-preference/importance/{user}/{lid}/6',expected=400)
    request('GET',f'place-preference/get/{user}',check=lambda v:v[0]['importance']==5 and v[0]['name']=='Updated test office')
    request('DELETE',f'place-preference/delete/{user}/{lid}')
    request('GET',f'saved-property/get/{user}',expected=400,check=lambda v:v['message']=='No saved properties found for this user')
    for ref in ['test-a','test-b']:
        request('POST',f'saved-property/add/{user}',{'externalPropertyId':ref,'source':'integration-test','titleSnapshot':ref})
    saved=request('GET',f'saved-property/get/{user}',check=lambda v:len(v)==2)
    pair={'firstPropertyId':'test-a','firstPropertySource':'integration-test','secondPropertyId':'test-b','secondPropertySource':'integration-test'}
    request('POST',f'property-comparison/add/{user}',pair,expected=201)
    cid=request('GET',f'property-comparison/get-by-user/{user}',check=lambda v:len(v)==1)[0]['id']
    request('GET',f'property-comparison/get-by-id/{user}/{cid}',check=lambda v:v['firstPropertyId']=='test-a')
    request('POST',f'property-comparison/add/{user}',pair,expected=400)
    request('PUT',f'property-comparison/update/{user}/{cid}',{**pair,'firstPropertyId':'test-b','secondPropertyId':'test-a'})
    request('GET',f'property-comparison/get-by-id/{user}/{cid}',check=lambda v:v['firstPropertyId']=='test-b')
    request('DELETE',f'property-comparison/delete/{user}/{cid}')
    for p in saved: request('DELETE',f'saved-property/delete/{user}/{p["id"]}')
    request('DELETE',f'user/delete/{user}')
    request('GET',f'user/get/{user}',expected=400)
    user=None
finally:
    if user:
        # Comparison relationship has no cascade. Clear test pairs first.
        try:
            for pair in request('GET',f'property-comparison/get-by-user/{user}'):
                request('DELETE',f'property-comparison/delete/{user}/{pair["id"]}')
            request('DELETE',f'user/delete/{user}')
        except Exception as e: print('Cleanup required for disposable user',user,type(e).__name__)
    Path('/tmp/madar-runtime-results.json').write_text(json.dumps(records,indent=2))
print(json.dumps({'passed_requests':len(records),'unique_mappings':len(set((v['method'],re.sub(r'/\d+(?=/|$)','/{id}',v['path'])) for v in records)),'report':'/tmp/madar-runtime-results.json'}))
