using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Drawing
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            //Upload size available
            services.AddSignalR(options =>
            {
                options.MaximumReceiveMessageSize = 1920 * 1080;
                options.StreamBufferCapacity = 20;
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseFileServer();
            app.UseRouting();
            
            app.UseEndpoints(endpoints =>
            {
                // Configure singalr
                endpoints.MapHub<DrawHub>("/hub", options => {
                    options.ApplicationMaxBufferSize = 10485760;
                    options.TransportMaxBufferSize = 10485760;
                });
            });
        }
    }
}
