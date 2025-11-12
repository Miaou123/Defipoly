# File Storage Setup Guide

This guide helps you set up file storage on your DigitalOcean droplet for Defipoly.

## Prerequisites
- DigitalOcean droplet with Ubuntu
- Node.js installed
- Nginx installed
- PM2 for process management

## 1. Setup Upload Directories

Run the setup script on your droplet:

```bash
cd /path/to/defipoly-backend
chmod +x setup-uploads.sh
sudo ./setup-uploads.sh
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Nginx

Copy the nginx config to your server:

```bash
sudo cp nginx-config-example.conf /etc/nginx/sites-available/defipoly
sudo ln -s /etc/nginx/sites-available/defipoly /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Remember to update:
- `server_name` with your domain
- Port numbers if different

## 4. Environment Variables

Add to your `.env` file:

```env
# Upload Configuration
UPLOAD_DIR=/var/www/defipoly/uploads
UPLOAD_URL_PREFIX=/uploads
```

## 5. File Size Limits

Current limits:
- Profile pictures: 2MB
- Board backgrounds: 5MB
- Card backgrounds: 3MB

Adjust in `/src/middleware/upload.js` if needed.

## 6. Storage Monitoring

Monitor disk usage:

```bash
# Check overall disk usage
df -h

# Check uploads folder size
du -sh /var/www/defipoly/uploads

# Find large files
find /var/www/defipoly/uploads -type f -size +1M -exec ls -lh {} \;
```

## 7. Cleanup Script (Optional)

Create a cron job to clean old files:

```bash
# Add to crontab
0 3 * * * find /var/www/defipoly/uploads -type f -mtime +30 -delete
```

## 8. Backup Strategy

Regular backups:

```bash
# Backup uploads
tar -czf uploads-$(date +%Y%m%d).tar.gz /var/www/defipoly/uploads

# Sync to external storage (optional)
rsync -av /var/www/defipoly/uploads/ /backup/location/
```

## 9. Scaling Considerations

When approaching storage limits:

1. **Short term (50-60GB used)**:
   - Implement more aggressive compression
   - Reduce file size limits
   - Clean up unused files

2. **Medium term (60-70GB used)**:
   - Add DigitalOcean Spaces ($5/month for 250GB)
   - Migrate old files to Spaces
   - Keep recent files on droplet

3. **Long term (70GB+ or 1k+ users)**:
   - Full migration to object storage (S3/Spaces/R2)
   - CDN integration for global performance
   - Consider dedicated media server

## 10. Security Notes

- Files are publicly accessible via URLs
- No sensitive data should be stored
- Consider adding rate limiting for uploads
- Monitor for abuse (large files, spam uploads)

## Troubleshooting

1. **Permission errors**: 
   ```bash
   sudo chown -R www-data:www-data /var/www/defipoly/uploads
   ```

2. **Nginx 404 errors**:
   - Check alias path in nginx config
   - Verify file exists in uploads directory

3. **Upload failures**:
   - Check disk space: `df -h`
   - Check Node.js logs: `pm2 logs`
   - Verify multer configuration