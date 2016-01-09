import _ from "lodash";
import {paddedN, bitsToN, nToBits, fromN} from "./core";

var availableTypes = {};

export function register(name, type) {
    availableTypes[name] = type;
}

export function encode(coder, object) {
    var {bits, blob} = coder.spec.encode(object);
    return coder.encodedVersion + paddedN(bits.length, 2) + bitsToN(bits) + blob;
}

export function decode(coder, string) {
    var version = fromN(string.substr(0, 2)),
        bitSize = fromN(string.substr(2, 2));

    var bitCharSize = Math.ceil(bitSize / 6);
    var bits = nToBits(string.substr(4, bitCharSize), bitSize);
    var blob = string.substr(4 + bitCharSize);
    var result = coder.spec.decode({bits, blob});
    return result.value;
}

export function fromJson(version, jsonSpec, migrate) {
    function loop(spec) {
	if (_.isArray(spec)) {
	    var method = spec[0];
	    if (method === 'array') {
		return availableTypes.array(_.map(_.rest(spec), loop));
	    } else {
		return availableTypes[method].apply(null, _.rest(spec));
	    }
	} else if (_.isObject(spec)) {
	    var entries = _.keys(spec).sort();
	    return availableTypes.object(_.object(_.map(entries, function (key) {
                return [key, loop(spec[key])];
	    })));
	}
    }

    return {
	version: version,
	spec: loop(jsonSpec),
	jsonSpec: jsonSpec,
	encodedVersion: paddedN(version, 2),
	migrate: migrate || (x => x)
    };
}