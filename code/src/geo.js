const vec3 = glMatrix.vec3;

const geo = {
  quad: () => {
    return {
      vertices: [
        1, 0, 1,
        -1, 0, 1,
        -1, 0, -1,
        1, 0, -1,
      ],
      uvs: [
        1, 1,
        0, 1,
        0, 0,
        1, 0,
      ],
      indices: [
        0, 1, 2,
        0, 2, 3,
      ],
    };
  },

  octohedron: () => {
    return {
      vertices: [
        1, 0, 0,
        -1, 0, 0,
        0, 1, 0,
        0, -1, 0,
        0, 0, 1,
        0, 0, -1,
      ],
      uvs: [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
        0, 0,
        1, 0,
      ],
      indices: [
        4, 0, 2,
        4, 2, 1,
        4, 1, 3,
        4, 3, 0,
        5, 2, 0,
        5, 1, 2,
        5, 3, 1,
        5, 0, 3,
      ],
    };
  },

  icosahedron: () => { 
    return {
      vertices: [
        -0.525731112119133606, 0, 0.850650808352039932,
        0.525731112119133606, 0, 0.850650808352039932,
        -0.525731112119133606, 0, -0.850650808352039932,

        0.525731112119133606, 0, -0.850650808352039932,
        0, 0.850650808352039932, 0.525731112119133606,
        0, 0.850650808352039932, -0.525731112119133606,

        0, -0.850650808352039932, 0.525731112119133606,
        0, -0.850650808352039932, -0.525731112119133606,
        0.850650808352039932, 0.525731112119133606, 0,

        -0.850650808352039932, 0.525731112119133606, 0,
        0.850650808352039932, -0.525731112119133606, 0,
        -0.850650808352039932, -0.525731112119133606, 0,
      ],
      indices: [
        1,4,0,
        4,9,0,
        4,5,9,
        8,5,4,
        1,8,4,
        1,10,8,
        10,3,8,
        8,3,5,
        3,2,5,
        3,7,2,
        3,10,7,
        10,6,7,
        6,11,7,
        6,0,11,
        6,1,0,
        10,1,6,
        11,0,9,
        2,11,9,
        5,2,9,
        11,2,7
      ],
    };
  },

  sphere: (iterations = 3) => {
    let { vertices, indices } = geo.icosahedron();

    for (let i = 0; i < iterations; i++) {
      const result = subdivide({ vertices, indices });

      vertices = result.vertices;
      indices = result.indices;
    }

    normalize(vertices);

    return {
      vertices,
      indices,
    };
  },
};

const subdivide = ({
  vertices,
  indices,
}) => {
  // cache of midpoint indices
  const midpointIndices = {};

  // create lists instead...
  const indexList = [];
  const vertexList = new Array(...vertices);

  // subdivide each triangle
  for (var i = 0; i < indices.length - 2; i += 3)
  {
      // grab indices of triangle
      const i0 = indices[i];
      const i1 = indices[i + 1];
      const i2 = indices[i + 2];

      // calculate new indices
      const m01 = getMidpointIndex(midpointIndices, vertexList, i0, i1);
      const m12 = getMidpointIndex(midpointIndices, vertexList, i1, i2);
      const m02 = getMidpointIndex(midpointIndices, vertexList, i2, i0);

      indexList.push(
        i0,   m01,  m02,
        i1,   m12,  m01,
        i2,   m02,  m12,
        m02,  m01,  m12,
      );
  }

  return {
    vertices: vertexList,
    indices: indexList,
  };
};

const getMidpointIndex = (midpointIndices, vertices, i0, i1) => {
  // create a key
  const edgeKey = `${Math.min(i0, i1)}-${Math.max(i0, i1)}`;

  let midpointIndex = -1;

  // if there is not index already...
  if (!midpointIndices.hasOwnProperty(edgeKey))
  {
      // grab the vertex values
      const i0x = i0 * 3;
      const i0y = i0 * 3 + 1;
      const i0z = i0 * 3 + 2;

      const i1x = i1 * 3;
      const i1y = i1 * 3 + 1;
      const i1z = i1 * 3 + 2;

      const v0 = vec3.fromValues(
        vertices[i0x],
        vertices[i0y],
        vertices[i0z]);
      const v1 = vec3.fromValues(
        vertices[i1x],
        vertices[i1y],
        vertices[i1z]);

      // calculate
      const midpoint = vec3.fromValues(
        (v0[0] + v1[0]) / 2,
        (v0[1] + v1[1]) / 2,
        (v0[2] + v1[2]) / 2);

      midpointIndex = vertices.length / 3;
      vertices.push(midpoint[0], midpoint[1], midpoint[2]);

      midpointIndices[edgeKey] = midpointIndex;
  } else {
    midpointIndex = midpointIndices[edgeKey];
  }

  return midpointIndex;
};

const normalize = (vertices) => {
  for (let i = 0; i < vertices.length; i += 3) {
    const v = vec3.fromValues(
      vertices[i],
      vertices[i + 1],
      vertices[i + 2]);
    
    vec3.normalize(v, v);

    vertices[i] = v[0];
    vertices[i + 1] = v[1];
    vertices[i + 2] = v[2];
  }
};

export default geo;
