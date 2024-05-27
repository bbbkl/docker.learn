FROM nginx:1

RUN touch /var/run/nginx.pid \
  && chown -R nginx:nginx /var/run/nginx.pid \
  && chown -R nginx:nginx /var/cache/nginx
USER nginx
# COPY default.conf /etc/nginx/conf.d/
# EXPOSE 8080
