//Modules
const fs = require('fs');
const http = require('http');
const path = require('path');

//Config
const PORT = process.env.PORT || 8044;

//Load Config:
const config = require("./data/options.json");

//Directory Mappings
const directories = {
	directories: { },
	directory_listing: config.directory_listing,
	index: (config.index instanceof Array) ? config.index : [config.index]
};

for (let folder of config.folders)
{
	
	if (!folder.url.match(/^([a-zA-z\-_0-9\/\.]+)|\*$/)) {
		console.error(`Invalid url path ${folder.url}`);
		continue;
	}

	if (!folder.path.match(/^([a-zA-z\-_0-9\/\.]+)$/)) {
		console.error(`Invalid directory path ${folder.path}`);
		continue;
	}

	if (folder.directory_listing === null) {
		folder.directory_listing = config.directory_listing;
	}

	let base_url = "";
	let directory = directories;

	if (folder.url != "*") {
		base_url = parts.shift();
		directory = (directories.directories[base_url] || (directories.directories[base_url] = { directories : { } }));

		for (let part in folder.url.split("/")) {
			directory = (directory.directories[part] || (directory.directories[part] = { directories : { } }));
		}
	}

	if (directory.path) {
		console.error(`Invalid url path ${folder.url}, can not appear more then once.`);
		continue;
	}

	if (folder.index && !(folder.index instanceof Array)) {
		folder.index = [folder.index];
	}

	directory.path = folder.path;
	directory.directory_listing = folder.directory_listing;
	directory.index = [...folder.index, ...directories.index];
	console.log(`Serving ${folder.path} at :${PORT}/${folder.url != "*" ? folder.url : ""}`);
}

//Error Handler
const error = (req, res, code, err) => {
	res.writeHead(200);
	res.end(code, 'utf-8');
	
	if (config.request_logging) {
		console.log(`Returned Code ${code}`);
		if (err) console.log("Reason:", err);
	}
};

const file = (req, res, filepath) => {
	fs.readFile(filepath, (err, data) => {
		if (err && err.code == 'ENOENT') return error(req, res, "404")
		if (err) return error(req, res, "401", err);
		
		res.writeHead(200);
		res.end(data);

		if (config.request_logging) console.log("Returned File.");
	});
};

//Handler:
const handler = (req, res) => {
	
	if (config.request_logging) console.log("Requesting:", req.url);
	
	let found;
	let location = [ ];
	let directory = directories;
	let parts = req.url.split("/");

	while (true) {
		part = parts.shift();

		if (part == null) {
			break;
		}

		if (part == "") {
			continue;
		}

		if (directory.directories && directory.directories[part]) {
			location.push(part);
			directory = directory.directories[part];
			if (directory.path) found = { location: [...location], parts: [...parts], directory };
			continue;
		}

		break;
	}

	if (found) {
		directory = found.directory;
		location = found.location;
		parts = found.parts;
	}

	if (!directory || !directory.path) return error(req, res, "404", "No redirection url found.");
	
	let userpath = path.join(...location, ...parts);
	let filepath = path.join(directory.path, ...parts);

	if (config.request_logging) console.log("Resolved Location:", filepath);
	
	fs.lstat(filepath, (err, stat) => {
		if (err) return error(req, res, "401", err);
		
		if (stat.isFile()) return file(req, res, filepath);
		
		if (stat.isDirectory()) {

			return fs.readdir(filepath, (err, files) => {
				if (err) return error(req, res, "401", err);

				if (directory.index) {
					for (index of directory.index) {
						if (files.includes(index)) {
							return file(req, res, path.join(filepath, index));
						}
					}
				}

				if (!directory.directory_listing) return error(req, res, "403", "Listing disabled.");
				
				res.setHeader('Content-type', 'text/html');
				res.writeHead(200);

				res.write(`Directory: ${userpath}`);
				
				for (let file of files) {
					res.write(`<br/><a href="/${path.join(userpath, file)}">${file}</a>`);
				}
				
				res.end();

				if (config.request_logging) console.log("Returned Directory.");
			});
		}
		
		return error(req, res, "404", "Location not found.");
	});
};

//Create http server.
console.log(`Starting HTTP server on port ${PORT}`);

http.createServer(handler).listen(PORT, () => {
	console.log(`HTTP server started.`);
});



