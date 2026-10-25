import pathlib,json,os,subprocess,hashlib,statistics,argparse
parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--output',required=True);parser.add_argument('--blocks',type=int,default=8);parser.add_argument('--iterations',type=int,default=512);args=parser.parse_args()
r=pathlib.Path(args.root);p=pathlib.Path(args.output);p.mkdir(parents=True,exist_ok=True);d=pathlib.Path(__file__).resolve().parent;base=os.environ.copy();base.pop('ELECTRON_RUN_AS_NODE',None);base.pop('VSCODE_DEV',None)
modules={v:'vs/workbench/services/extensions/common/rpcProtocol.'+v+'.js'for v in ['control','no-store','clone']};hashes={v:hashlib.sha256((r/'out'/m).read_bytes()).hexdigest()for v,m in modules.items()}
for kind,concurrency,asyncHandler in [('node',1,False),('node',32,False),('renderer',1,False),('renderer',32,False),('renderer',1,True)]:
 label=f'{kind}-{concurrency}-'+('async'if asyncHandler else 'sync');options={'root':str(r),'modules':modules,'blocks':args.blocks,'iterations':args.iterations,'samples':3,'concurrency':concurrency,'seed':3212525,'asyncHandler':asyncHandler};env={**base,'IPC_OPT_BENCH_OPTIONS':json.dumps(options),'OUTPUT':str(p/(label+'.json'))}
 command=['node','--import',str(d/'product-pool.mjs'),str(d/'node.mjs')]if kind=='node'else['xvfb-run','-a',str(r/'.build/electron/code-oss'),'--no-sandbox','--disable-gpu','--user-data-dir='+str(p/'renderer-profile'),str(d/'paired-renderer-main.cjs')]
 print('Start',label,flush=True)
 with (p/(label+'.log')).open('w')as f:proc=subprocess.run(command,cwd=r,env=env,stdout=f,stderr=f,timeout=1200)
 if proc.returncode:raise RuntimeError(f'{label} failed {proc.returncode}: '+(p/(label+'.log')).read_text()[-1500:])
 result=json.loads(pathlib.Path(env['OUTPUT']).read_text());result['compiledSHA256']=hashes;pathlib.Path(env['OUTPUT']).write_text(json.dumps(result,indent=2))
 for name in sorted(f['name']for f in result['blocks'][0]['fixtures']):
  values={v:statistics.median(x for b in result['blocks']for f in b['fixtures']if f['name']==name for run in f['runs']if run['variant']==v for x in run['microsecondsPerRoundTrip'])for v in modules};print(label,name,{v:round((values[v]/values['control']-1)*100,2)for v in modules if v!='control'},flush=True)
for v,m in modules.items():assert hashlib.sha256((r/'out'/m).read_bytes()).hexdigest()==hashes[v]
