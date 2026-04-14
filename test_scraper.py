import urllib.request
import urllib.parse
import time

time.sleep(3)  # Wait for service to start

url = 'http://127.0.0.1:8000/api/v1/scrape?' + urllib.parse.urlencode({
    'url': 'https://www.shopkabir.com/',
    'org_id': 'test-org'
})
req = urllib.request.Request(url, data=b'', method='POST')

try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        print('Status:', resp.status)
        response = resp.read().decode()
        print('Response:')
        print(response)
except Exception as e:
    print('Error:', e)