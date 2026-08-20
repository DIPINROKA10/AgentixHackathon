import zipfile, os, glob

archive_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(archive_dir, '..', '..', 'archive', 'PS_20174392719_1491204439457_log.csv')
out_path = os.path.normpath(out_path)

parts = sorted(glob.glob(os.path.join(archive_dir, 'paysim_part*.zip')))
print(f'Found {len(parts)} parts, merging...')

with open(out_path, 'wb') as outf:
    for zp in parts:
        with zipfile.ZipFile(zp, 'r') as zf:
            bin_name = zf.namelist()[0]
            data = zf.read(bin_name)
            outf.write(data)
            print(f'  + {os.path.basename(zp)} ({len(data)/1024/1024:.1f}MB)')

print(f'Done -> {out_path} ({os.path.getsize(out_path)/1024/1024:.1f}MB)')
