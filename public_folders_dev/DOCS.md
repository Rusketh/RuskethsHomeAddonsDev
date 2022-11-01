# Public Folders

Public Folders is a Home Assistant (HA) addon that can be used to serve HA directories directly via HTTP without needing to authorize the request though HA. This allows you to either use HA as a quick and dirty webserver for HTML files or allow access to media files for devices that do not support authorization.


# Configuration

**Folders:** This is a list of locations that Public Folders will serve. 

    - url: media
      path: /media/public
    - url: music
      path: /media/music
      directory_listing: true
      
The above example will add 2 locations to public folders ***http://\<ha url\>:\<port\>\\media*** & ***http://\<ha url\>:\<port\>\\music*** each one will serve the path specified.

Each location supports an override for the ***directory_listing*** setting, if set to true this will allow users to browse the files & folders under that path.

It is also useful to note that location url's can also be paths, for example if I wanted to host my Metalica playlist at ***http://\<ha url\>:\<port\>\\music\metalica*** I would use.

      - url: music/metalica
        path: /media/music/metalica/black_album
        directory_listing: true

In instances where you wish to use Public Folders to serve as a basic HTML website, you can set the url of a location to ***\****, this will serve a path directly at ***http://\<ha url\>:\<port\>*** with out any additonal path on the url.

      - url: *
        path: /media/webroot

**Index:** When a directory is being served and a file on this list exists with in that directory, it will be served instead of a directory listing or a 404 response.

**Directory Listing:** This is the default value of ***directory_listing*** for all locations, if enabled users can browse the files and folders within a given location.

**Request Logging:** If set to true, Public Folders will log locations visited and files served to the addons log, this is useful for debugging.